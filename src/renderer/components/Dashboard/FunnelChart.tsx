import React, { useEffect, useRef } from 'react';
import styles from './Dashboard.module.css';

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
}

interface FunnelChartProps {
  data?: FunnelStep[]; // Make data optional to handle undefined props
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ensure data is always an array before calling .map
  const safeData = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (containerRef.current) {
      const stepElements = containerRef.current.querySelectorAll(`.${styles.funnelStep}`);
      safeData.forEach((step, index) => {
        const el = stepElements[index] as HTMLElement;
        if (el) {
          el.style.setProperty('--step-width', `${step.percentage}%`);
        }
      });
    }
  }, [safeData]);

  return (
    <div className={styles.funnelWrapper} ref={containerRef}>

      {safeData.length > 0 ? (
        safeData.map((step, index) => (
          <div
            key={index}
            className={styles.funnelStep}
          >
            <span className={styles.stepLabel}>{step.label}</span>
            <span className={styles.stepValue}>{step.value.toLocaleString()}</span>
          </div>
        ))
      ) : (
        <div className={styles.noData}>لا توجد بيانات متوفرة حالياً</div>
      )}
    </div>
  );
};

export default FunnelChart;