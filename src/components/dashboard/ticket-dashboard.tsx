import { useEffect, useState, useRef } from "react";
import { TicketCard } from "./ticket-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircledIcon, 
  MinusCircledIcon, 
  ReloadIcon, 
  MoonIcon, 
  SunIcon, 
  DownloadIcon, 
  UploadIcon,
  UpdateIcon,
  SpeakerLoudIcon
} from "@radix-ui/react-icons";
import { ApiIndicator, MappedTicket, API_CONFIG, UserConfig, TEAM_PROJECTS, SOUND_ALERTS } from "./api-types";
import { ConfigDialog } from "./config-dialog";

interface Ticket {
  id_chamado: string;
  nome_cliente: string;
  data_abertura: string;
  sla_limite: string;
  status: string;
  analista: string;
  teamProject?: string;
  slaStatusResolution?: string;
}

export function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Load config from localStorage or use defaults
  const [config, setConfig] = useState<UserConfig>(() => {
    const savedConfig = localStorage.getItem('slaMonitorConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig) as UserConfig;
      } catch (e) {
        console.error("Failed to parse saved config:", e);
      }
    }
    
    // Default configuration if nothing saved
    return {
      darkMode: true, // Default to dark mode for TV displays
      enabledProjects: {
        "Public.Wbc7": true,
        "UFO.ETRM": true,
        "SRM.wbc7srm": true
      },
      soundAlertEnabled: true, // Enable sound alerts by default
      selectedSound: "default", // Default sound alert
      customDataSourceUrl: API_CONFIG.indicadoresUrl, // Default to the standard URL
      useCustomDataSource: false, // Don't use custom URL by default
      refreshInterval: API_CONFIG.refreshInterval, // Default refresh interval
      riskThresholdDays: {
        "Public.Wbc7": 1,
        "UFO.ETRM": 1,
        "SRM.wbc7srm": 1
      } // Default risk threshold is 1 day for each project
    };
  });

  // Audio reference for sound alerts
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [biIntegrated, setBiIntegrated] = useState<boolean>(false);
  const [previousEmRisco, setPreviousEmRisco] = useState<number>(0);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    emRisco: 0,
    estourados: 0,
    pausados: 0,
    saudaveis: 0
  });

  // Map API data to Ticket format
  const mapIndicatorsToTickets = (apiIndicators: ApiIndicator[]): Ticket[] => {
    return apiIndicators.map(indicator => {
      // Map status values from API to our application status
      // The mapping is from "Custom.SupportCaseStatus" to our internal status
      let ticketStatus = "Em andamento";
      
      // Extract agent name from the assigned to field (before the email part)
      const assignedToFull = indicator["System.AssignedTo"] || "Não atribuído";
      const assignedTo = assignedToFull.split('<')[0].trim();
      
      // Extract customer nickname from the full name (assuming format: "ClientName [Nickname]")
      let customerName = indicator["Custom.CustomerName"] || "Cliente não especificado";
      const nicknameMatch = customerName.match(/\[(.*?)\]/);
      if (nicknameMatch && nicknameMatch[1]) {
        customerName = nicknameMatch[1].trim(); // Use nickname if available
      }
      
      // Map status values to our internal statuses
      const supportCaseStatus = indicator["Custom.SupportCaseStatus"] || "";
      const systemState = indicator["System.State"] || "";
      const slaStatusResolution = indicator["Custom.SLAStatusResolution"] || "";
      
      // Check if status contains specific keywords or if System.State is "Resolved"
      if (supportCaseStatus.includes("Blocked") || supportCaseStatus.includes("Pending") || 
          supportCaseStatus.includes("On Hold") || supportCaseStatus.includes("Suspended") ||
          systemState === "Resolved") {
        ticketStatus = "Pausado";
      } else if (supportCaseStatus.includes("Resolved") || supportCaseStatus.includes("Completed") || 
                 supportCaseStatus.includes("Awaiting")) {
        ticketStatus = "Fechado";
      } else {
        // Default to "Em andamento" for all other statuses
        ticketStatus = "Em andamento";
      }
      
      // Get the changed date from the API or use current date as fallback
      let dataAbertura: Date;
      try {
        dataAbertura = new Date(indicator["System.ChangedDate"]);
        if (isNaN(dataAbertura.getTime())) {
          // Invalid date, use current date minus 5 days as fallback
          dataAbertura = new Date();
          dataAbertura.setDate(dataAbertura.getDate() - 5);
        }
      } catch (e) {
        // Exception handling - use current date minus 5 days
        dataAbertura = new Date();
        dataAbertura.setDate(dataAbertura.getDate() - 5);
      }
      
      // Use the SLA target date from the API or calculate a default one
      let slaLimit: Date;
      try {
        if (indicator["Custom.SLATargetDateResolution"]) {
          slaLimit = new Date(indicator["Custom.SLATargetDateResolution"]);
          if (isNaN(slaLimit.getTime())) {
            // Invalid date, calculate a default SLA date (current date + 3 days)
            slaLimit = new Date();
            slaLimit.setDate(slaLimit.getDate() + 3);
          }
        } else {
          // No SLA date provided, calculate a default (current date + 3 days)
          slaLimit = new Date();
          slaLimit.setDate(slaLimit.getDate() + 3);
        }
      } catch (e) {
        // Exception handling - use current date plus 3 days
        slaLimit = new Date();
        slaLimit.setDate(slaLimit.getDate() + 3);
      }
      
      return {
        id_chamado: `WI-${indicator["System.Id"] || "Unknown"}`,
        nome_cliente: customerName,
        data_abertura: dataAbertura.toISOString(),
        sla_limite: slaLimit.toISOString(),
        status: ticketStatus,
        analista: assignedTo, // Add analyst name to ticket data
        teamProject: indicator["System.TeamProject"] || "Unknown", // Add team project to ticket data
        slaStatusResolution: slaStatusResolution // Add SLA status resolution from API
      };
    });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let data: Ticket[] = [];
      let usedApi = false;
      
      try {
        // Determine which URL to use based on configuration
        const apiUrl = config.useCustomDataSource && config.customDataSourceUrl 
          ? config.customDataSourceUrl
          : API_CONFIG.indicadoresUrl;

        console.log('Fetching data from URL:', apiUrl);
        
        // Add timestamp to URL to bypass caching
        const urlWithCacheBuster = apiUrl.includes('?') 
          ? `${apiUrl}&_t=${new Date().getTime()}` 
          : `${apiUrl}?_t=${new Date().getTime()}`;
        
        console.log('URL with cache buster:', urlWithCacheBuster);
        
        // Fetch from the selected data source with all cache-busting methods
        const apiResponse = await fetch(urlWithCacheBuster, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });
        
        if (apiResponse.ok) {
          const responseText = await apiResponse.text();
          console.log('API response received, length:', responseText.length);
          
          try {
            // First try to parse as JSON
            const apiData: ApiIndicator[] = JSON.parse(responseText);
            console.log('API data parsed successfully, items:', apiData.length);
            
            // Always try to process the data, even if some fields might be missing
            // Our mapIndicatorsToTickets function has been enhanced to handle missing fields
            data = mapIndicatorsToTickets(apiData);
            usedApi = true;
            console.log('Successfully transformed API data to tickets:', data.length);
            
            // Show sample of processed data to help debugging
            if (data.length > 0) {
              console.log('Sample ticket data:', data[0]);
              console.log('Original API data sample:', apiData[0]);
            }
          } catch (parseError) {
            console.error('Failed to parse API response as JSON:', parseError);
            console.error('Response text preview:', responseText.substring(0, 200));
            throw new Error('Erro ao processar resposta da API: formato inválido');
          }
        } else {
          console.error('API response error:', apiResponse.status, apiResponse.statusText);
          throw new Error(`API indisponível (${apiResponse.status}), usando dados locais`);
        }
      } catch (apiError) {
        // Log error in detail to help with debugging
        console.error('API Error Details:', apiError);
        console.warn('Fallback to local data due to:', apiError.message);
        
        // Fallback to local JSON file if API fails
        const fallbackResponse = await fetch(API_CONFIG.fallbackUrl);
        
        if (!fallbackResponse.ok) {
          throw new Error('Falha ao carregar dados locais');
        }
        
        data = await fallbackResponse.json();
      }
      
      // Set tickets data
      setTickets(data);
      
      // Calculate and set the summary statistics
      // We need to wait for the state to update, so calculate using the data directly
      const stats = calculateSummaryStatsFromData(data);
      
      // Play alert sound if new "Em Risco" tickets appear and sound alerts are enabled
      if (stats.emRisco > previousEmRisco && !loading && config.soundAlertEnabled) {
        try {
          // Always use the single alert sound
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          
          // Set the source to the alert sound
          audioRef.current.src = '/sounds/Alerta.mp3';
          audioRef.current.volume = 0.5;
          audioRef.current.play().catch(e => {
            console.error("Failed to play alert sound:", e);
          });
        } catch (e) {
          console.error("Failed to play alert sound:", e);
        }
      }
      
      // Update previous risk count after processing
      setPreviousEmRisco(stats.emRisco);
      
      // Set the summary statistics
      setSummaryStats(stats);
      
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('pt-BR');
      
      // Set just the time without source indicator
      setLastUpdated(timeString);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    // Set up interval for refreshing data using configured refresh interval
    const interval = setInterval(() => {
	fetchTickets();
	}, 300000); // 5 minutos fixos

    
    // Apply dark mode to body
    if (config.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return () => clearInterval(interval);
  }, [config.darkMode, config.useCustomDataSource, config.customDataSourceUrl]);
  
  // Single effect to update summary stats when enabledProjects, risk threshold, or tickets change
  useEffect(() => {
    if (!loading && tickets.length > 0) {
      // Recalculate summary statistics based on the current filters
      const stats = calculateSummaryStats();
      setSummaryStats(stats);
      console.log("Recalculated stats:", stats);
    }
  }, [config.enabledProjects, config.riskThresholdDays, loading, tickets]);
  
  // BI Integration functions
  const connectToPowerBI = () => {
    // This is a placeholder for actual Power BI integration
    console.log("Connecting to Power BI...");
    setBiIntegrated(true);
    
    // Simulate integration (in real implementation, this would be a Power BI connection)
    setTimeout(() => {
      alert("Conectado ao Power BI com sucesso!");
    }, 1000);
  };
  
  const exportToBI = () => {
    const dataToExport = {
      summary: summaryStats,
      ticketsData: tickets
    };
    
    // Create a blob from the data
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sla_dashboard_export_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom sorting function as per requested order: EM RISCO, EXPIRADO, DENTRO DO PRAZO, PAUSADO
  const sortedTickets = [...tickets].sort((a, b) => {
    const now = new Date();
    
    // Helper function to determine SLA status with numerical priority based on precise definitions:
    // EM RISCO: chamados que estão prestes a expirar no dia.
    // EXPIRADO: chamados cujo o status é "Expired"
    // DENTRO DO PRAZO: chamados cujo status é "In time"
    // PAUSADO: chamado cujo status é "Paused"
    const getSlaStatus = (ticket: Ticket) => {
      // Priority order: 1=EM RISCO, 2=EXPIRADO, 3=DENTRO DO PRAZO, 4=PAUSADO
      
      // Directly match status strings for PAUSADO
      if (ticket.status === "Pausado" || ticket.status === "Resolved" || ticket.status === "Paused") {
        return 4; // PAUSADO - lowest priority
      }
      
      // Closed tickets have lowest priority
      if (ticket.status === "Fechado") {
        return 5; // CONCLUÍDO - lowest priority
      }
      
      // Check if status directly matches "Expired"
      if (ticket.status === "Expired") {
        return 2; // EXPIRADO - second highest priority
      }
      
      // Check if status directly matches "In time"
      if (ticket.status === "In time") {
        return 3; // DENTRO DO PRAZO - third priority
      }
      
      // For tickets in progress that don't have an explicit status,
      // calculate based on SLA limit and configured risk threshold
      if (ticket.status === "Em andamento") {
        const slaLimit = new Date(ticket.sla_limite);
        if (isNaN(slaLimit.getTime())) {
          return 3; // Default to DENTRO DO PRAZO if invalid date
        }
        
        // Get the risk threshold for this ticket's project
        const projectKey = ticket.teamProject as keyof typeof config.riskThresholdDays;
        const riskThresholdDays = config.riskThresholdDays[projectKey] || 1; // Default to 1 day if project not configured
        
        const today = new Date();
        const timeDifference = slaLimit.getTime() - today.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        
        if (today > slaLimit) {
          return 2; // EXPIRADO - second highest priority
        } else if (daysDifference >= 0 && daysDifference <= riskThresholdDays) {
          return 1; // EM RISCO - highest priority (dentro do prazo de risco configurado)
        } else {
          return 3; // DENTRO DO PRAZO - third priority
        }
      }
      
      // Default case
      return 3; // DENTRO DO PRAZO
    };
    
    const statusA = getSlaStatus(a);
    const statusB = getSlaStatus(b);
    
    // Sort by priority number (lower number = higher priority)
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // For tickets with same priority, sort by SLA limit (soonest first)
    return new Date(a.sla_limite).getTime() - new Date(b.sla_limite).getTime();
  });

  // Get the base filtered tickets by team project (common for all tabs)
  // This preserves the sort order from sortedTickets
  const getTeamProjectFilteredTickets = () => {
    return sortedTickets.filter(ticket => {
      // If no team project defined, always include the ticket
      if (!ticket.teamProject) return true;
      
      // Check if the ticket's team project is enabled in the user config
      return config.enabledProjects[ticket.teamProject as keyof typeof config.enabledProjects] || false;
    });
  };
  
  // Helper function to check if a ticket is "Em Risco" (prestes a expirar dentro do prazo configurado)
  const isTicketEmRisco = (ticket: Ticket) => {
    // First check if ticket is already expired (takes priority over at-risk)
    if (isTicketEstourado(ticket)) return false;
    
    // Check API SLA status resolution field for at-risk indicators
    if (ticket.slaStatusResolution) {
      const slaStatus = ticket.slaStatusResolution.toLowerCase();
      if (slaStatus.includes("at risk") || 
          slaStatus.includes("warning") || 
          slaStatus.includes("em risco") ||
          slaStatus.includes("approaching")) {
        return true;
      }
    }
    
    // Direct match for status if available
    if (ticket.status === "Em Risco") return true;
    
    // Only active tickets can be "Em Risco"
    if (ticket.status !== "Em andamento") return false;
    
    // If SLA limit is missing or invalid, the ticket can't be assessed for risk
    if (!ticket.sla_limite) return false;
    
    // Get the risk threshold for this ticket's project
    const projectKey = ticket.teamProject as keyof typeof config.riskThresholdDays;
    const riskThresholdDays = config.riskThresholdDays[projectKey] || 1; // Default to 1 day if project not configured
    
    const now = new Date();
    const slaLimit = new Date(ticket.sla_limite);
    
    // If SLA date is invalid, can't assess risk
    if (isNaN(slaLimit.getTime())) return false;
    
    // Calculate the difference in days between now and SLA limit
    const timeDifference = slaLimit.getTime() - now.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    // Consider weekend days (0 = Sunday, 6 = Saturday)
    const limitDayOfWeek = slaLimit.getDay();
    const isWeekend = limitDayOfWeek === 0 || limitDayOfWeek === 6;
    
    // A ticket is at risk if:
    // 1. Days until expiration <= configured risk threshold
    // 2. It's not a weekend day (optional - remove this condition if weekends should be considered)
    // 3. It hasn't expired yet (daysDifference >= 0)
    return daysDifference >= 0 && daysDifference <= riskThresholdDays && !isWeekend;
  };
  
  // Helper function to check if a ticket is "Estourado" (Expired)
  const isTicketEstourado = (ticket: Ticket) => {
    // First check the API SLA status resolution field
    if (ticket.slaStatusResolution) {
      // Check for various expired status values from the API
      const slaStatus = ticket.slaStatusResolution.toLowerCase();
      if (slaStatus.includes("expired") || 
          slaStatus.includes("breach") || 
          slaStatus.includes("overdue") ||
          slaStatus.includes("expirado") ||
          slaStatus.includes("estourado")) {
        return true;
      }
    }
    
    // Direct match for status
    if (ticket.status === "Expired") return true;
    
    // For tickets in progress, check if they've already passed the SLA limit
    if (ticket.status === "Em andamento") {
      const now = new Date();
      const slaLimit = new Date(ticket.sla_limite);
      if (isNaN(slaLimit.getTime())) return false;
      
      // Only consider as expired if the current time is strictly past the SLA limit
      // This ensures tickets that expire tomorrow don't show as red today
      return now > slaLimit;
    }
    
    return false;
  };
  
  // Helper function to check if a ticket is "Saudável" (In time / Dentro do Prazo)
  const isTicketSaudavel = (ticket: Ticket) => {
    // Direct match for status
    if (ticket.status === "In time") return true;
    
    // Only tickets with "Em andamento" status can be healthy
    if (ticket.status !== "Em andamento") return false;
    
    // For tickets in progress, they're healthy if not at risk and not expired
    // First check if expired (this takes priority)
    if (isTicketEstourado(ticket)) return false;
    
    // Then check if at risk
    if (isTicketEmRisco(ticket)) return false;
    
    // If neither expired nor at risk, then it's healthy
    return true;
  };

  // Calculate summary stats directly from provided data
  const calculateSummaryStatsFromData = (data: Ticket[]) => {
    // Filter by enabled team projects
    const filteredTickets = data.filter(ticket => {
      if (!ticket.teamProject) return true;
      return config.enabledProjects[ticket.teamProject as keyof typeof config.enabledProjects] || false;
    });
    
    let emRisco = 0;
    let estourados = 0;
    let pausados = 0;
    let saudaveis = 0;
    const total = filteredTickets.length;
    
    filteredTickets.forEach((ticket: Ticket) => {
      if (ticket.status === 'Pausado' || ticket.status === 'Resolved') {
        pausados += 1;
      } else if (ticket.status === 'Fechado') {
        // Count closed tickets separately if needed
      } else if (ticket.status === 'Em andamento') {
        if (isTicketEstourado(ticket)) {
          estourados += 1;
        } else if (isTicketEmRisco(ticket)) {
          emRisco += 1;
        } else {
          saudaveis += 1;
        }
      }
    });
    
    return { total, emRisco, estourados, pausados, saudaveis };
  };
  
  // Filter tickets based on active tab and team project settings
  const getFilteredTickets = () => {
    // First get filtered tickets by team project (these are already sorted)
    const teamProjectFiltered = getTeamProjectFilteredTickets();
    
    // Then apply tab-specific filters
    let result;
    switch (activeTab) {
      case "emRisco":
        result = teamProjectFiltered.filter(isTicketEmRisco);
        break;
      case "dentroPrazo":
        // WITHIN DEADLINE tab shows both "AT RISK" and "WITHIN DEADLINE" tickets
        result = teamProjectFiltered.filter(ticket => isTicketEmRisco(ticket) || isTicketSaudavel(ticket));
        break;
      case "estourados":
        result = teamProjectFiltered.filter(isTicketEstourado);
        break;
      case "pausados":
        result = teamProjectFiltered.filter(ticket => ticket.status === "Pausado" || ticket.status === "Resolved");
        break;
      default:
        result = teamProjectFiltered;
    }
    
    return result;
  };
  
  // Calculate summary statistics based on the filtered tickets by team project
  const calculateSummaryStats = () => {
    // Make sure we're working with the current data filtered by team project
    const baseFilteredTickets = getTeamProjectFilteredTickets();
    
    let emRisco = 0;
    let estourados = 0;
    let pausados = 0;
    let saudaveis = 0;
    let emAndamento = 0;
    let total = 0;
    
    // First count total tickets that match the team project filter
    total = baseFilteredTickets.length;
    
    // Then categorize each ticket
    baseFilteredTickets.forEach((ticket: Ticket) => {
      if (ticket.status === 'Pausado' || ticket.status === 'Resolved') {
        pausados += 1;
      } else if (ticket.status === 'Fechado') {
        // Count closed tickets separately if needed - they don't appear in any main category
      } else if (ticket.status === 'Em andamento') {
        emAndamento += 1;
        
        // Categorize based on SLA status with strict priority:
        // 1. First check if expired (highest priority)
        if (isTicketEstourado(ticket)) {
          estourados += 1;
        }
        // 2. Then check if at risk (second priority)  
        else if (isTicketEmRisco(ticket)) {
          emRisco += 1;
        }
        // 3. Finally, if neither expired nor at risk, it's healthy
        else {
          saudaveis += 1;
        }
      }
    });
    
    // Verify that our counts match up
    console.log(`Stats calculation: Total=${total}, EmRisco=${emRisco}, Estourados=${estourados}, Pausados=${pausados}, Saudaveis=${saudaveis}`);
    
    return {
      total,
      emRisco,
      estourados,
      pausados,
      saudaveis
    };
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <ExclamationTriangleIcon className="h-8 w-8" />
        <AlertTitle className="text-2xl">Erro</AlertTitle>
        <AlertDescription className="text-xl">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`w-full max-w-[2560px] px-8 py-8 min-h-screen ${config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="w-full">
          <h1 className={`text-5xl font-extrabold mb-3 text-center ${config.darkMode 
            ? "bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent" 
            : "bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent"}`}>
            SUPORTE PARADIGMA MONITORAMENTO SLA
          </h1>
          <p className={`text-xl flex items-center justify-center ${config.darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Última atualização: {lastUpdated}
            <ReloadIcon className="ml-3 h-5 w-5" />
            <span className="text-base ml-2">
              (Atualização automática a cada {Math.floor((config.refreshInterval || API_CONFIG.refreshInterval) / (1000 * 60))} min)
            </span>
          </p>
        </div>
        
        <div className="flex items-center space-x-6 mt-4 md:mt-0">
          {/* Configuration Dialog */}
          <div className="flex items-center space-x-2">
            <ConfigDialog 
              config={config}
              onConfigChange={(newConfig) => {
                // Save to state
                setConfig(newConfig);
                // Persist to localStorage
                localStorage.setItem('slaMonitorConfig', JSON.stringify(newConfig));
              }}
            />
          </div>
          
{/* BI Integration buttons removed as requested */}
        </div>
      </div>

      {/* Status Indicator Cards - More horizontal, less vertical */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className={`border-l-8 h-24 ${config.darkMode ? 'bg-gray-800 border-gray-700' : ''} ${
          summaryStats.emRisco > 0 
            ? `border-l-yellow-500 ${config.darkMode ? 'shadow-yellow-900/30' : 'shadow-yellow-200'} shadow-lg` 
            : 'border-l-yellow-300'
        }`}>
          <div className="flex items-center h-full px-4">
            <ClockIcon className="h-7 w-7 mr-3 text-yellow-500 flex-shrink-0" />
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${config.darkMode ? 'text-white' : ''} ${summaryStats.emRisco > 0 ? 'blink-risk' : ''}`}>EM RISCO</span>
                <span className={`text-4xl font-bold text-yellow-500 ${summaryStats.emRisco > 0 ? 'blink-risk' : ''}`}>{summaryStats.emRisco}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className={`border-l-8 border-l-green-500 h-24 ${config.darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <div className="flex items-center h-full px-4">
            <CheckCircledIcon className="h-7 w-7 mr-3 text-green-500 flex-shrink-0" />
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${config.darkMode ? 'text-white' : ''}`}>DENTRO DO PRAZO</span>
                <span className="text-4xl font-bold text-green-500">{summaryStats.saudaveis + summaryStats.emRisco}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className={`border-l-8 h-24 ${config.darkMode ? 'bg-gray-800 border-gray-700' : ''} ${
          summaryStats.estourados > 0 
            ? `border-l-red-500 ${config.darkMode ? 'shadow-red-900/30' : 'shadow-red-200'} shadow-lg` 
            : 'border-l-red-300'
        }`}>
          <div className="flex items-center h-full px-4">
            <ExclamationTriangleIcon className="h-7 w-7 mr-3 text-red-500 flex-shrink-0" />
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${config.darkMode ? 'text-white' : ''}`}>EXPIRADO</span>
                <span className="text-4xl font-bold text-red-500">{summaryStats.estourados}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className={`border-l-8 border-l-gray-400 h-24 ${config.darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <div className="flex items-center h-full px-4">
            <MinusCircledIcon className="h-7 w-7 mr-3 text-gray-500 flex-shrink-0" />
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${config.darkMode ? 'text-white' : ''}`}>PAUSADO</span>
                <span className="text-4xl font-bold text-gray-500">{summaryStats.pausados}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className={`border-l-8 h-24 ${config.darkMode ? 'bg-gray-800 border-gray-700' : ''}`} style={{borderLeftColor: '#6366f1'}}>
          <div className="flex items-center h-full px-4">
            <UpdateIcon className="h-7 w-7 mr-3 flex-shrink-0" style={{color: '#6366f1'}} />
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${config.darkMode ? 'text-white' : ''}`}>TOTAL</span>
                <span className={`text-4xl font-bold ${config.darkMode ? 'text-white' : ''}`} style={{color: '#6366f1'}}>{summaryStats.total}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab navigation - with larger text - TODOS moved to first position */}
      <Tabs 
        value={activeTab} 
        onValueChange={(newTab) => {
          setActiveTab(newTab);
          // The summary stats are always calculated based on all tickets (filtered by team project only)
          // This ensures they're consistent regardless of tab selection
          const stats = calculateSummaryStats();
          setSummaryStats(stats);
        }}
        className="mb-8"
      >
        <TabsList className={`grid grid-cols-5 h-16 ${config.darkMode ? 'bg-gray-800' : ''}`}>
          <TabsTrigger 
            value="all" 
            className={`text-2xl font-bold ${
              config.darkMode 
                ? activeTab === "all" ? "bg-blue-900/40 text-blue-300" : "text-gray-300"
                : activeTab === "all" ? "bg-blue-100" : ""
            }`}
          >
            TODOS ({summaryStats.total})
          </TabsTrigger>
          <TabsTrigger 
            value="emRisco" 
            className={`text-2xl font-bold ${
              config.darkMode 
                ? activeTab === "emRisco" ? "bg-yellow-900/40 text-yellow-300" : "text-gray-300"
                : activeTab === "emRisco" ? "bg-yellow-100" : ""
            }`}
          >
            EM RISCO ({summaryStats.emRisco})
          </TabsTrigger>
          <TabsTrigger 
            value="dentroPrazo" 
            className={`text-2xl font-bold ${
              config.darkMode 
                ? activeTab === "dentroPrazo" ? "bg-green-900/40 text-green-300" : "text-gray-300"
                : activeTab === "dentroPrazo" ? "bg-green-100" : ""
            }`}
          >
            DENTRO DO PRAZO ({summaryStats.emRisco + summaryStats.saudaveis})
          </TabsTrigger>
          <TabsTrigger 
            value="estourados" 
            className={`text-2xl font-bold ${
              config.darkMode 
                ? activeTab === "estourados" ? "bg-red-900/40 text-red-300" : "text-gray-300"
                : activeTab === "estourados" ? "bg-red-100" : ""
            }`}
          >
            EXPIRADOS ({summaryStats.estourados})
          </TabsTrigger>
          <TabsTrigger 
            value="pausados" 
            className={`text-2xl font-bold ${
              config.darkMode 
                ? activeTab === "pausados" ? "bg-gray-900/40 text-gray-300" : "text-gray-300"
                : activeTab === "pausados" ? "bg-gray-200" : ""
            }`}
          >
            PAUSADOS ({summaryStats.pausados})
          </TabsTrigger>
        </TabsList>

        {/* Content for each tab */}
        {["all", "emRisco", "dentroPrazo", "estourados", "pausados"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="h-[150px]">
                    <CardContent className="p-4">
                      <Skeleton className="h-8 w-1/3 mb-2" />
                      <Skeleton className="h-10 w-4/5 mb-4" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                getFilteredTickets().map((ticket) => {
                  // Get the risk threshold for this ticket's project
                  const projectKey = ticket.teamProject as keyof typeof config.riskThresholdDays;
                  const riskThresholdDays = config.riskThresholdDays[projectKey] || 1;
                  
                  return (
                    <TicketCard 
                      key={ticket.id_chamado} 
                      {...ticket} 
                      riskThresholdDays={riskThresholdDays}
                    />
                  );
                })
              )}
            </div>
            
            {/* Empty state message */}
            {!loading && getFilteredTickets().length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-gray-500 mb-2">Sem chamados nesta categoria</h3>
                <p className="text-gray-400">Não há chamados disponíveis para exibição</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
