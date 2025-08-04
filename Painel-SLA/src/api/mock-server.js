// This is a mock API server that simulates the microservice described
// To simulate a real-world API endpoint while we develop the frontend

// Mock data generator function
function generateIndicadores() {
  const statuses = ['normal', 'alerta', 'crítico', 'pausado'];
  const indicadorTypes = [
    'Tempo Médio de Atendimento',
    'Chamados Pendentes', 
    'Taxa de Resolução',
    'Satisfação do Cliente',
    'Tempo de Espera',
    'SLA Cumprido',
    'Backlog Total',
    'Incidentes Críticos'
  ];
  
  return indicadorTypes.map((nome, id) => {
    // Generate a random value appropriate for each indicator type
    let valor;
    let status;
    
    switch(nome) {
      case 'Tempo Médio de Atendimento':
        valor = Math.round(10 + Math.random() * 20); // 10-30 minutes
        status = valor > 25 ? 'crítico' : (valor > 15 ? 'alerta' : 'normal');
        break;
      case 'Chamados Pendentes':
        valor = Math.round(Math.random() * 50); // 0-50 tickets
        status = valor > 35 ? 'crítico' : (valor > 20 ? 'alerta' : 'normal');
        break;
      case 'Taxa de Resolução':
        valor = Math.round(70 + Math.random() * 30); // 70-100%
        status = valor < 80 ? 'crítico' : (valor < 90 ? 'alerta' : 'normal');
        break;
      case 'Satisfação do Cliente':
        valor = Math.round(70 + Math.random() * 30) / 10; // 7.0-10.0 score
        status = valor < 8 ? 'crítico' : (valor < 9 ? 'alerta' : 'normal');
        break;
      case 'Tempo de Espera':
        valor = Math.round(Math.random() * 60); // 0-60 minutes
        status = valor > 30 ? 'crítico' : (valor > 15 ? 'alerta' : 'normal');
        break;
      case 'SLA Cumprido':
        valor = Math.round(70 + Math.random() * 30); // 70-100%
        status = valor < 90 ? 'crítico' : (valor < 95 ? 'alerta' : 'normal');
        break;
      case 'Backlog Total':
        valor = Math.round(Math.random() * 100); // 0-100 tickets
        status = valor > 70 ? 'crítico' : (valor > 40 ? 'alerta' : 'normal');
        break;
      case 'Incidentes Críticos':
        valor = Math.round(Math.random() * 10); // 0-10 incidents
        status = valor > 5 ? 'crítico' : (valor > 2 ? 'alerta' : 'normal');
        break;
      default:
        valor = Math.round(Math.random() * 100);
        status = statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    // Randomly set some indicators to 'pausado' status
    if (Math.random() > 0.9) {
      status = 'pausado';
    }
    
    return {
      id: id + 1,
      nome,
      valor,
      status,
      dataAtualizacao: new Date().toISOString()
    };
  });
}

// MSW (Mock Service Worker) or similar library would be better for a production app
// But for demo purposes, we'll use this simple approach
export function setupMockApi() {
  // Save the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to intercept API calls
  window.fetch = function(input, init) {
    // Check if this is a request to our mock API endpoint
    if (input === '/api/indicadores') {
      console.log('Intercepting request to /api/indicadores');
      
      // Generate mock data
      const mockData = generateIndicadores();
      
      // Return a mock response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData)
      });
    }
    
    // For all other requests, use the original fetch function
    return originalFetch.apply(this, arguments);
  };
  
  console.log('Mock API server setup complete');
}