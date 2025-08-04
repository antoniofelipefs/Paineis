import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  id_chamado: string;
  nome_cliente: string;
  data_abertura: string;
  sla_limite: string;
  status: string;
  analista?: string;
}

export function TicketCard({ 
  id_chamado,
  nome_cliente,
  data_abertura,
  sla_limite, 
  status,
  analista = "Não atribuído"
}: TicketCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [slaPercentage, setSlaPercentage] = useState<number>(0);
  const [slaStatus, setSlaStatus] = useState<"green" | "yellow" | "red" | "gray">("green");

  useEffect(() => {
    const updateSlaInfo = () => {
      if (status === "Pausado" || status === "Resolved") {
        setTimeLeft("PAUSADO");
        setSlaStatus("gray");
        setSlaPercentage(100);
        return;
      }

      if (status === "Fechado") {
        setTimeLeft("CONCLUÍDO");
        setSlaStatus("gray");
        setSlaPercentage(100);
        return;
      }
      
      // Check if SLA limit date is available
      if (!sla_limite) {
        setTimeLeft("SEM PRAZO");
        setSlaStatus("gray");
        setSlaPercentage(50); // Set to 50% as a visual indicator
        return;
      }

      const now = new Date();
      const openTime = new Date(data_abertura);
      
      // Check if SLA limit is a valid date
      const limitTime = new Date(sla_limite);
      if (isNaN(limitTime.getTime())) {
        setTimeLeft("DATA INVÁLIDA");
        setSlaStatus("gray");
        setSlaPercentage(50);
        return;
      }

      // If SLA has expired
      if (now > limitTime) {
        setTimeLeft("EXPIRADO");
        setSlaStatus("red");
        setSlaPercentage(100);
        return;
      }

      // Calculate time left
      const totalDuration = limitTime.getTime() - openTime.getTime();
      const elapsedDuration = now.getTime() - openTime.getTime();
      const remainingDuration = limitTime.getTime() - now.getTime();

      // Calculate the percentage of time elapsed
      const percentageUsed = (elapsedDuration / totalDuration) * 100;
      setSlaPercentage(percentageUsed);

      // Determine if the expiration date is today
      const isToday = 
        limitTime.getDate() === now.getDate() && 
        limitTime.getMonth() === now.getMonth() && 
        limitTime.getFullYear() === now.getFullYear();
      
      // Consider weekend days (0 = Sunday, 6 = Saturday)
      const limitDayOfWeek = limitTime.getDay();
      const isWeekend = limitDayOfWeek === 0 || limitDayOfWeek === 6;
      
      // Set status based on the rules:
      // - Only cards that expire today are yellow (at risk)
      // - Only expired cards are red
      // - All others are green (within deadline)
      
      if (now > limitTime) {
        // Already expired
        setSlaStatus("red");
      } else if (isToday && !isWeekend) {
        // Expires today and it's not a weekend
        setSlaStatus("yellow");
      } else {
        // All other cases (future expiration)
        setSlaStatus("green");
      }

      // Format the remaining time
      const hours = Math.floor(remainingDuration / (1000 * 60 * 60));
      const minutes = Math.floor((remainingDuration % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m RESTANTES`);
    };

    updateSlaInfo();
    const interval = setInterval(updateSlaInfo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data_abertura, sla_limite, status]);

  return (
    <Card className={cn(
      "transition-all duration-300 shadow-md hover:shadow-lg border-l-8",
      status === "Pausado" ? "border-l-gray-400" : 
      status === "Fechado" ? "border-l-gray-300" :
      slaStatus === "red" ? "border-l-red-500" :
      slaStatus === "yellow" ? "border-l-yellow-500 shadow-yellow-300 shadow-lg" :
      "border-l-green-500",
      (slaStatus === "yellow" && status === "Em andamento") ? "transform scale-105 z-10 blink-risk" : "",
      document.documentElement.classList.contains('dark') ? "bg-gray-800 border-gray-700" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex flex-row justify-between gap-2 items-center mb-2">
          <div className="flex flex-col overflow-hidden">
            <h3 className={cn(
              "text-2xl font-bold truncate max-w-[300px] lg:max-w-[400px]",
              document.documentElement.classList.contains('dark') ? "text-white" : ""
            )}>
              {nome_cliente}
            </h3>
            <div className={cn(
              "text-lg font-semibold whitespace-nowrap",
              document.documentElement.classList.contains('dark') ? "text-gray-400" : "text-gray-500"
            )}>
              {id_chamado}
            </div>
          </div>
          <Badge 
            variant={
              status === "Pausado" ? "secondary" : 
              status === "Fechado" ? "outline" :
              slaStatus === "red" ? "destructive" :
              slaStatus === "yellow" ? "warning" :
              "success"
            }
            className="text-base px-3 py-1 whitespace-nowrap"
          >
            {status}
          </Badge>
        </div>

        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className={cn(
              "text-xl font-medium",
              document.documentElement.classList.contains('dark') ? "text-gray-300" : ""
            )}>
              SLA
            </span>
            <span className={cn(
              "text-xl font-bold",
              status === "Pausado" ? "text-gray-500" : 
              status === "Fechado" ? "text-gray-500" :
              slaStatus === "red" ? "text-red-500" :
              slaStatus === "yellow" ? "text-yellow-500 font-extrabold blink-risk" :
              "text-green-500"
            )}>
              {timeLeft}
            </span>
          </div>
          <Progress 
            value={slaPercentage} 
            className={cn(
              "h-3",
              status === "Pausado" 
                ? document.documentElement.classList.contains('dark') ? "bg-gray-700" : "bg-gray-200"
                : status === "Fechado" 
                ? document.documentElement.classList.contains('dark') ? "bg-gray-700" : "bg-gray-200"
                : document.documentElement.classList.contains('dark') ? "bg-gray-700" : ""
            )}
            indicatorClassName={cn(
              status === "Pausado" ? "bg-gray-400" : 
              status === "Fechado" ? "bg-gray-300" :
              slaStatus === "red" ? "bg-red-500" :
              slaStatus === "yellow" ? "bg-yellow-500" :
              "bg-green-500"
            )}
          />
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <div className={cn(
            "text-base",
            document.documentElement.classList.contains('dark') ? "text-gray-400" : "text-gray-500"
          )}>
            {status === "Pausado" || status === "Resolved" ? (
              "Prazo será recalculado após reativação"
            ) : sla_limite && !isNaN(new Date(sla_limite).getTime()) ? (
              <>
                Expira em: {new Date(sla_limite).toLocaleString('pt-BR', {
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </>
            ) : (
              "Prazo não disponível"
            )}
          </div>
          <div className={cn(
            "text-base font-medium",
            document.documentElement.classList.contains('dark') ? "text-gray-300" : "text-gray-700"
          )}>
            Analista: {analista}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}