// API Response Types
export interface ApiIndicator {
  "System.Id": number;
  "System.TeamProject": string;
  "System.State": string;
  "System.AssignedTo": string;
  "System.ChangedDate": string;
  "System.ChangedBy": string;
  "System.Title": string;
  "Custom.CustomerId": string;
  "Custom.CustomerName": string;
  "Custom.SLATargetDateResolution": string;
  "Custom.SupportCaseStatus": string;
  "Custom.SLAStatusResolution"?: string;
}

export interface MappedTicket {
  id_chamado: string;
  nome_cliente: string;
  data_abertura: string;
  sla_limite: string;
  status: string;
  analista: string;
  teamProject: string;
}

// User configuration interface
export interface UserConfig {
  darkMode: boolean;
  enabledProjects: {
    "Public.Wbc7": boolean;
    "UFO.ETRM": boolean;
    "SRM.wbc7srm": boolean;
  };
  soundAlertEnabled: boolean;
  selectedSound: string;
  customDataSourceUrl: string;
  useCustomDataSource: boolean;
  refreshInterval: number; // Added refresh interval option
  riskThresholdDays: {[key: string]: number}; // Configurable days threshold for "at risk" tickets, per project
}

// Sound alert options
export const SOUND_ALERTS = [
  {
    id: "default",
    name: "Alerta",
    url: '/sounds/Alerta.mp3'
  }
];

// Team project constants
export const TEAM_PROJECTS = {
  "Public.Wbc7": "WBC7 Public",
  "UFO.ETRM": "UFO ETRM",
  "SRM.wbc7srm": "WBC7 SRM"
};

// API Configuration
export const API_CONFIG = {
  // LogicalApps Azure Logic App endpoint
  indicadoresUrl: 'https://prod-57.eastus2.logic.azure.com:443/workflows/79e82843c76c4657908e68f53e7eb4b7/triggers/Requisicao/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FRequisicao%2Frun&sv=1.0&sig=HjkK_KMNKqd8HT5DMIBNpPmKpnnJua2feoozuclC6UM',
  
  // Fallback to local data if API fails
  fallbackUrl: '/data/tickets.json',
  
  // Refresh interval in milliseconds (30 seconds)
  refreshInterval: 30000
};

// Additional documentation about the API endpoints
/**
 * API Endpoints Documentation
 * 
 * GET /api/indicadores
 * Returns a list of all service indicators with their current status
 * Response format: Array<ApiIndicator>
 * 
 * Future endpoints (not yet implemented):
 * GET /api/chamados
 * Returns detailed information about open tickets
 * 
 * GET /api/estatisticas
 * Returns statistical information about tickets, resolution times, etc.
 */