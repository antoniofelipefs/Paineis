import { APP_CONFIG } from "./app-config";
import { useEffect, useState, useRef } from "react";
import { TicketCard } from "./ticket-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircledIcon, 
  MinusCircledIcon, 
  ReloadIcon,
  UpdateIcon 
} from "@radix-ui/react-icons";
import { ApiIndicator, API_CONFIG, UserConfig } from "./api-types";
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

  const [config, setConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem("slaMonitorConfig");
    if (saved) {
      try { return JSON.parse(saved) as UserConfig; } 
      catch (e) { console.error("Erro ao ler config:", e); }
    }
    return {
      darkMode: true,
      enabledProjects: {
        "Public.Wbc7": true,
        "UFO.ETRM": true,
        "SRM.wbc7srm": true
      },
      soundAlertEnabled: true,
      selectedSound: "default",
      customDataSourceUrl: API_CONFIG.indicadoresUrl,
      useCustomDataSource: false,
      riskThresholdDays: {
        "Public.Wbc7": 1,
        "UFO.ETRM": 1,
        "SRM.wbc7srm": 1
      }
    };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previousEmRisco, setPreviousEmRisco] = useState<number>(0);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    emRisco: 0,
    estourados: 0,
    pausados: 0,
    saudaveis: 0
  });

  // --- Mapeamento API para Tickets ---
  const mapIndicatorsToTickets = (apiIndicators: ApiIndicator[]): Ticket[] => {
    return apiIndicators.map(indicator => {
      let ticketStatus = "Em andamento";
      const assignedTo = (indicator["System.AssignedTo"] || "Não atribuído").split('<')[0].trim();
      let customerName = indicator["Custom.CustomerName"] || "Cliente não especificado";
      const nicknameMatch = customerName.match(/\[(.*?)\]/);
      if (nicknameMatch?.[1]) customerName = nicknameMatch[1].trim();

      const supportCaseStatus = indicator["Custom.SupportCaseStatus"] || "";
      const systemState = indicator["System.State"] || "";
      const slaStatusResolution = indicator["Custom.SLAStatusResolution"] || "";

      if (supportCaseStatus.match(/Blocked|Pending|On Hold|Suspended/) || systemState === "Resolved") {
        ticketStatus = "Pausado";
      } else if (supportCaseStatus.match(/Resolved|Completed|Awaiting/)) {
        ticketStatus = "Fechado";
      }

      let dataAbertura = new Date(indicator["System.ChangedDate"] || "");
      if (isNaN(dataAbertura.getTime())) { dataAbertura = new Date(); dataAbertura.setDate(dataAbertura.getDate() - 5); }

      let slaLimit = new Date(indicator["Custom.SLATargetDateResolution"] || "");
      if (isNaN(slaLimit.getTime())) { slaLimit = new Date(); slaLimit.setDate(slaLimit.getDate() + 3); }

      return {
        id_chamado: `WI-${indicator["System.Id"] || "Unknown"}`,
        nome_cliente: customerName,
        data_abertura: dataAbertura.toISOString(),
        sla_limite: slaLimit.toISOString(),
        status: ticketStatus,
        analista: assignedTo,
        teamProject: indicator["System.TeamProject"] || "Unknown",
        slaStatusResolution
      };
    });
  };

  // --- Função para buscar tickets ---
  const fetchTickets = async () => {
    try {
      setLoading(true);
      let data: Ticket[] = [];
      try {
        const apiUrl = config.useCustomDataSource && config.customDataSourceUrl 
          ? config.customDataSourceUrl 
          : API_CONFIG.indicadoresUrl;
        const urlWithCacheBuster = apiUrl.includes('?') 
          ? `${apiUrl}&_t=${new Date().getTime()}` 
          : `${apiUrl}?_t=${new Date().getTime()}`;

        const response = await fetch(urlWithCacheBuster, { 
          method: 'GET', 
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, 
          cache: 'no-store' 
        });

        if (!response.ok) throw new Error(`API indisponível (${response.status})`);

        const apiData: ApiIndicator[] = await response.json();
        data = mapIndicatorsToTickets(apiData);
      } catch (apiError) {
        console.warn("Falha na API, usando fallback:", apiError);
        const fallbackResponse = await fetch(API_CONFIG.fallbackUrl);
        if (!fallbackResponse.ok) throw new Error('Falha ao carregar dados locais');
        data = await fallbackResponse.json();
      }

      setTickets(data);

      const stats = calculateSummaryStatsFromData(data);
      if (stats.emRisco > previousEmRisco && !loading && config.soundAlertEnabled) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = '/sounds/Alerta.mp3';
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.error("Falha ao reproduzir som:", e));
      }
      setPreviousEmRisco(stats.emRisco);
      setSummaryStats(stats);

      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
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
    const interval = setInterval(fetchTickets, APP_CONFIG.refreshInterval);

    if (config.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    return () => clearInterval(interval);
  }, [config.darkMode, config.useCustomDataSource, config.customDataSourceUrl]);

  useEffect(() => {
    if (!loading && tickets.length > 0) {
      const stats = calculateSummaryStats();
      setSummaryStats(stats);
    }
  }, [config.enabledProjects, config.riskThresholdDays, loading, tickets]);

  // --- Funções de status ---
  const isTicketEstourado = (ticket: Ticket) => {
    const slaStatus = ticket.slaStatusResolution?.toLowerCase() || "";
    if (slaStatus.match(/expired|breach|overdue|expirado|estourado/)) return true;
    if (ticket.status === "Expired") return true;
    if (ticket.status === "Em andamento") return new Date() > new Date(ticket.sla_limite);
    return false;
  };

  const isTicketEmRisco = (ticket: Ticket) => {
    if (isTicketEstourado(ticket)) return false;
    const slaStatus = ticket.slaStatusResolution?.toLowerCase() || "";
    if (slaStatus.match(/at risk|warning|em risco|approaching/)) return true;
    if (ticket.status === "Em Risco") return true;
    if (ticket.status !== "Em andamento" || !ticket.sla_limite) return false;

    const riskThresholdDays = config.riskThresholdDays[ticket.teamProject as keyof typeof config.riskThresholdDays] || 1;
    const now = new Date();
    const slaLimit = new Date(ticket.sla_limite);
    if (isNaN(slaLimit.getTime())) return false;

    const daysDifference = Math.ceil((slaLimit.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const isWeekend = [0,6].includes(slaLimit.getDay());
    return daysDifference >= 0 && daysDifference <= riskThresholdDays && !isWeekend;
  };

  const isTicketSaudavel = (ticket: Ticket) => {
    if (ticket.status !== "Em andamento") return false;
    return !isTicketEstourado(ticket) && !isTicketEmRisco(ticket);
  };

  const calculateSummaryStatsFromData = (data: Ticket[]) => {
    const filtered = data.filter(t => !t.teamProject || config.enabledProjects[t.teamProject as keyof typeof config.enabledProjects]);
    let emRisco=0, estourados=0, pausados=0, saudaveis=0;
    filtered.forEach(t => {
      if (["Pausado","Resolved"].includes(t.status)) pausados++;
      else if (t.status === "Em andamento") {
        if (isTicketEstourado(t)) estourados++;
        else if (isTicketEmRisco(t)) emRisco++;
        else saudaveis++;
      }
    });
    return { total: filtered.length, emRisco, estourados, pausados, saudaveis };
  };

  const getTeamProjectFilteredTickets = () =>
    sortedTickets.filter(t => !t.teamProject || config.enabledProjects[t.teamProject as keyof typeof config.enabledProjects]);

  const getFilteredTickets = () => {
    const base = getTeamProjectFilteredTickets();
    switch (activeTab) {
      case "emRisco": return base.filter(isTicketEmRisco);
      case "dentroPrazo": return base.filter(t => isTicketEmRisco(t) || isTicketSaudavel(t));
      case "estourados": return base.filter(isTicketEstourado);
      case "pausados": return base.filter(t => ["Pausado","Resolved"].includes(t.status));
      default: return base;
    }
  };

  // --- Ordenação ---
  const sortedTickets = [...tickets].sort((a, b) => {
    const getPriority = (t: Ticket) => {
      if (["Pausado","Resolved"].includes(t.status)) return 4;
      if (t.status === "Fechado") return 5;
      if (t.status === "Expired") return 2;
      if (t.status === "In time") return 3;

      if (t.status === "Em andamento") {
        const slaLimit = new Date(t.sla_limite);
        if (isNaN(slaLimit.getTime())) return 3;
        const riskThreshold = config.riskThresholdDays[t.teamProject as keyof typeof config.riskThresholdDays] || 1;
        const diffDays = Math.ceil((slaLimit.getTime() - new Date().getTime()) / (1000*3600*24));
        if (new Date() > slaLimit) return 2;
        if (diffDays >= 0 && diffDays <= riskThreshold) return 1;
        return 3;
      }
      return 3;
    };
    const prioA = getPriority(a), prioB = getPriority(b);
    if (prioA !== prioB) return prioB - prioA;
    return new Date(a.sla_limite).getTime() - new Date(b.sla_limite).getTime();
  });

  return (
    <div className={`p-4 ${config.darkMode ? "dark" : ""}`}>
      <ConfigDialog 
        config={config}
        onConfigChange={(newConfig) => {
          const updatedConfig = { ...newConfig };
          setConfig(updatedConfig);
          localStorage.setItem("slaMonitorConfig", JSON.stringify(updatedConfig));
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Monitor SLA</h1>
        <span className="text-sm text-gray-500">
          Atualização automática a cada {Math.floor(APP_CONFIG.refreshInterval / (1000*60))} min
        </span>
        <button onClick={fetchTickets} title="Atualizar manualmente">
          <ReloadIcon className="w-5 h-5"/>
        </button>
      </div>

      {error && <Alert variant="destructive">
        <ExclamationTriangleIcon />
        <AlertTitle>Erro!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>}

      <Card className="mb-4">
        <CardContent className="flex justify-around">
          <div>Total: {summaryStats.total}</div>
          <div>Em Risco: {summaryStats.emRisco}</div>
          <div>Estourados: {summaryStats.estourados}</div>
          <div>Pausados: {summaryStats.pausados}</div>
          <div>Saudáveis: {summaryStats.saudaveis}</div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="emRisco">Em Risco</TabsTrigger>
          <TabsTrigger value="dentroPrazo">Dentro do Prazo</TabsTrigger>
          <TabsTrigger value="estourados">Estourados</TabsTrigger>
          <TabsTrigger value="pausados">Pausados</TabsTrigger>
        </TabsList>

        {["all","emRisco","dentroPrazo","estourados","pausados"].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <Skeleton className="h-24 w-full mb-2" />
            ) : (
              getFilteredTickets().map(ticket => (
                <TicketCard key={ticket.id_chamado} ticket={ticket} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
