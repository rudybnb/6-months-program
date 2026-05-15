import React from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import type { PartnerData } from '../types';
import './PartnerStatus.css';

interface PartnerStatusProps {
  partner: PartnerData;
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partner }) => {
  return (
    <div className="partner-status-card fade-up">
      <div className="partner-status-header">
        <span className="partner-status-title">Accountability Partner</span>
      </div>
      <div className="partner-status-body">
        <div className="partner-status-icon">
          {partner.completedToday ? (
            <CheckCircle2 size={24} className="status-complete" />
          ) : (
            <CircleDashed size={24} className="status-pending" />
          )}
        </div>
        <div className="partner-status-info">
          <p className="partner-status-name">{partner.name}</p>
          <p className="partner-status-message">
            {partner.completedToday
              ? `${partner.name} completed their session today. Let's keep the momentum.`
              : `${partner.name} is working on their session today.`}
          </p>
        </div>
      </div>
    </div>
  );
};
