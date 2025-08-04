# SLA Monitoring API Documentation

This document provides information about the REST API endpoints used by the SLA Monitoring Dashboard.

## Current Endpoints

### GET /api/indicadores

Returns a list of all service indicators with their current status.

**Response Format:**
```typescript
interface ApiIndicator {
  id: number;
  nome: string;
  valor: number;
  status: string;
  dataAtualizacao: string;
}
```

**Sample Response:**
```json
[
  {
    "id": 1,
    "nome": "Tempo Médio de Atendimento",
    "valor": 15,
    "status": "normal",
    "dataAtualizacao": "2023-07-31T14:30:00.000Z"
  },
  {
    "id": 2,
    "nome": "Chamados Pendentes",
    "valor": 28,
    "status": "alerta",
    "dataAtualizacao": "2023-07-31T14:30:00.000Z"
  },
  {
    "id": 3,
    "nome": "Taxa de Resolução",
    "valor": 75,
    "status": "crítico",
    "dataAtualizacao": "2023-07-31T14:30:00.000Z"
  }
]
```

## Implementation Notes

Currently, the dashboard uses a mock implementation that simulates API responses. In a production environment, you would:

1. Replace the mock implementation with actual API calls to your backend service
2. Update the API_CONFIG.indicadoresUrl value to point to your real API endpoint
3. Implement proper error handling and authentication as needed

## Data Transformation

The API response is transformed into the ticket format required by the dashboard using the mapIndicatorsToTickets function, which:

1. Takes an array of ApiIndicator objects
2. Maps each indicator to a ticket with appropriate SLA calculations
3. Returns an array of tickets that can be displayed on the dashboard

## Future Endpoints

The following endpoints are planned for future implementation:

### GET /api/chamados

Will return detailed information about open tickets, including:
- Complete history
- Assigned technicians
- Customer information
- Priority levels

### GET /api/estatisticas

Will return statistical information about tickets, including:
- Resolution times
- Average wait times
- Customer satisfaction scores
- Team performance metrics