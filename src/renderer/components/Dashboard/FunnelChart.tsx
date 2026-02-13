import React from 'react';
import './Dashboard.module.css';

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
}

interface FunnelChartProps {
  data?: FunnelStep[]; // Make data optional to handle undefined props
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data = [] }) => {
  // Ensure data is always an array before calling .map
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="funnelWrapper">
      
      {safeData.length > 0 ? (
        safeData.map((step, index) => (
          <div 
            key={index} 
            className="funnelStep" 
            style={{ width: `${step.percentage}%` }}
          >
            <span className="stepLabel">{step.label}</span>
            <span className="stepValue">{step.value.toLocaleString()}</span>
          </div>
        ))
      ) : (
        <div className="no-data">لا توجد بيانات متوفرة حالياً</div>
      )}
    </div>
  );
};

export default FunnelChart;