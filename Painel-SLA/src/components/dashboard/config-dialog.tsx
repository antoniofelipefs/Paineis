import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GearIcon, MoonIcon, SunIcon, SpeakerLoudIcon, SpeakerOffIcon, PlayIcon, Link2Icon, UpdateIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { TEAM_PROJECTS, UserConfig, SOUND_ALERTS, API_CONFIG } from "./api-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ConfigDialogProps {
  config: UserConfig;
  onConfigChange: (config: UserConfig) => void;
}

export function ConfigDialog({ config, onConfigChange }: ConfigDialogProps) {
  const [localConfig, setLocalConfig] = React.useState<UserConfig>({ ...config });

  // Update local config when props change
  React.useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);

  const handleDarkModeChange = (checked: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      darkMode: checked
    }));
  };

  const handleProjectToggle = (project: string, checked: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      enabledProjects: {
        ...prev.enabledProjects,
        [project]: checked
      }
    }));
  };
  
  const handleSoundAlertToggle = (checked: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      soundAlertEnabled: checked
    }));
  };
  
  // Always set to default since we only have one sound option
  const handleSoundChange = () => {
    setLocalConfig(prev => ({
      ...prev,
      selectedSound: "default"
    }));
  };
  
  const handleCustomUrlChange = (value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      customDataSourceUrl: value
    }));
  };

  const handleCustomUrlToggle = (checked: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      useCustomDataSource: checked
    }));
  };
  
  const handleRefreshIntervalChange = (value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      refreshInterval: parseInt(value)
    }));
  };

  const handleRiskThresholdChange = (value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      riskThresholdPercentage: parseInt(value)
    }));
  };
  
  const playSelectedSound = () => {
    if (localConfig.soundAlertEnabled) {
      const audio = new Audio('/sounds/Alerta.mp3');
      audio.volume = 0.5;
      audio.play()
        .then(() => console.log("Playing alert sound"))
        .catch(error => console.error("Error playing sound:", error));
    }
  };

  const resetToDefaultUrl = () => {
    setLocalConfig(prev => ({
      ...prev,
      customDataSourceUrl: API_CONFIG.indicadoresUrl
    }));
  };

  const handleSave = (close: () => void) => {
    onConfigChange(localConfig);
    close();
  };

  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <GearIcon className="h-5 w-5" />
          <span className="sr-only">Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Dashboard</DialogTitle>
          <DialogDescription>
            Personalize a exibição do dashboard conforme suas preferências.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center space-x-3 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                {localConfig.darkMode ? (
                  <MoonIcon className="h-5 w-5 text-blue-300 mr-2" />
                ) : (
                  <SunIcon className="h-5 w-5 text-yellow-500 mr-2" />
                )}
                <p className="text-sm font-medium leading-none">
                  Modo Escuro
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Alterar entre modo claro e escuro
              </p>
            </div>
            <Switch
              checked={localConfig.darkMode}
              onCheckedChange={handleDarkModeChange}
            />
          </div>
          
          {/* Sound Alert Toggle */}
          <div className="flex items-center space-x-3 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                {localConfig.soundAlertEnabled ? (
                  <SpeakerLoudIcon className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <SpeakerOffIcon className="h-5 w-5 text-gray-500 mr-2" />
                )}
                <p className="text-sm font-medium leading-none">
                  Alerta Sonoro
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ativar alerta sonoro para tickets "EM RISCO"
              </p>
            </div>
            <Switch
              checked={localConfig.soundAlertEnabled || false}
              onCheckedChange={handleSoundAlertToggle}
            />
          </div>
          
          {/* Sound Alert Testing */}
          {localConfig.soundAlertEnabled && (
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Som do Alerta</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={playSelectedSound}
                  disabled={!localConfig.soundAlertEnabled}
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Testar
                </Button>
              </div>
            </div>
          )}

          {/* Refresh Interval Setting */}
          <div className="flex items-center space-x-3 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <UpdateIcon className="h-5 w-5 text-purple-500 mr-2" />
                <p className="text-sm font-medium leading-none">
                  Intervalo de Atualização
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Tempo entre atualizações automáticas
              </p>
            </div>
            <Select
              value={localConfig.refreshInterval?.toString() || API_CONFIG.refreshInterval.toString()}
              onValueChange={handleRefreshIntervalChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15000">15 segundos</SelectItem>
                <SelectItem value="30000">30 segundos</SelectItem>
                <SelectItem value="60000">1 minuto</SelectItem>
                <SelectItem value="120000">2 minutos</SelectItem>
                <SelectItem value="300000">5 minutos</SelectItem>
                <SelectItem value="600000">10 minutos</SelectItem>
                <SelectItem value="900000">15 minutos</SelectItem>
                <SelectItem value="1800000">30 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Threshold Setting by Days */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm font-medium leading-none">
                Limite para Chamados em Risco (dias)
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Quantos dias restantes para o SLA expirar para considerar o chamado em risco
            </p>
            
            {Object.keys(TEAM_PROJECTS).map((project) => (
              <div key={`risk-${project}`} className="flex items-center space-x-3 mb-2">
                <Label className="w-40 text-sm">{TEAM_PROJECTS[project]}:</Label>
                <Select
                  value={(localConfig.riskThresholdDays?.[project] || 1).toString()}
                  onValueChange={(value) => {
                    setLocalConfig(prev => ({
                      ...prev,
                      riskThresholdDays: {
                        ...prev.riskThresholdDays,
                        [project]: parseInt(value)
                      }
                    }));
                  }}
                >
                  <SelectTrigger className="w-[90px]">
                    <SelectValue placeholder="Dias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="2">2 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="10">10 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Custom Data Source URL */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link2Icon className="h-5 w-5 mr-2 text-blue-500" />
                <Label htmlFor="customDataSource" className="text-sm font-medium">
                  URL Personalizada
                </Label>
              </div>
              <Switch
                id="customDataSource"
                checked={localConfig.useCustomDataSource || false}
                onCheckedChange={handleCustomUrlToggle}
              />
            </div>
            
            {localConfig.useCustomDataSource && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      id="dataSourceUrl"
                      placeholder="Digite a URL de origem dos dados"
                      value={localConfig.customDataSourceUrl || ""}
                      onChange={(e) => handleCustomUrlChange(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaultUrl}
                    title="Restaurar URL padrão"
                  >
                    Padrão
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Insira a URL da API de onde os dados dos chamados serão carregados.
                </p>
              </div>
            )}
          </div>

          {/* Team Projects Selection */}
          <div className="space-y-2 mt-2">
            <Label htmlFor="teamProjects" className="text-base">
              Filtrar por Projetos
            </Label>
            <Card>
              <CardContent className="pt-6">
                {Object.keys(TEAM_PROJECTS).map((project) => (
                  <div key={project} className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id={`project-${project}`}
                      checked={localConfig.enabledProjects[project] || false}
                      onCheckedChange={(checked) => handleProjectToggle(project, !!checked)}
                    />
                    <Label
                      htmlFor={`project-${project}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {TEAM_PROJECTS[project]}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Selecione os projetos que deseja exibir no dashboard
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => {
              onConfigChange(localConfig);
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}