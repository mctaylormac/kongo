import { LucideIcon } from "../../../lib/icons";
import { Card, CardContent } from "./Card";
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  subValue,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "#1D1D1F",
  index = 0,
}: StatCardProps) {
  const changeColors = {
    positive: "text-[#34C759]",
    negative: "text-[#FF3B30]",
    neutral: "text-[#86868B]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <Card className="transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border-black/5 overflow-hidden group">
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <p className="text-[13px] text-[#86868B] font-semibold tracking-tight uppercase opacity-70">{title}</p>
              <p className="text-[28px] font-black text-[#1D1D1F] mt-2 tracking-tighter">{value}</p>
              {subValue && (
                <p className="text-[11px] text-[#86868B] mt-1 font-medium italic opacity-60">
                  {subValue}
                </p>
              )}
              {change && (
                <p className={`text-[13px] font-medium mt-2 ${changeColors[changeType]}`}>
                  {change}
                </p>
              )}
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12"
              style={{
                backgroundColor: `${iconColor}15`,
              }}
            >
              <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2.5} />
            </div>
          </div>
          {/* Subtle background decoration */}
          <div 
            className="absolute -right-2 -bottom-2 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"
            style={{ backgroundColor: iconColor }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
