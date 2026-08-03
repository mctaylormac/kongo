import React from 'react';
import { motion } from 'motion/react';

interface PaymentLogoProps {
  type: 'orange_money' | 'airtel_money' | 'mpesa' | 'visa' | 'mastercard' | 'equity_bank' | 'rawbank' | 'tmb' | 'biac';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PaymentLogo({ type, className = '', size = 'md' }: PaymentLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const logos = {
    orange_money: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center shadow-lg border border-orange-700`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'OM' : size === 'md' ? 'OM' : 'Orange'}
        </div>
      </div>
    ),
    airtel_money: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg border border-red-700`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'AM' : size === 'md' ? 'AM' : 'Airtel'}
        </div>
      </div>
    ),
    mpesa: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-green-700 to-green-800 rounded-lg flex items-center justify-center shadow-lg border border-green-800`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'MP' : size === 'md' ? 'M-P' : 'M-Pesa'}
        </div>
      </div>
    ),
    visa: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-700 to-blue-800 rounded-lg flex items-center justify-center shadow-lg border border-blue-800`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-wide`}>
          {size === 'sm' ? 'V' : 'VISA'}
        </div>
      </div>
    ),
    mastercard: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-red-700 to-red-800 rounded-lg flex items-center justify-center shadow-lg border border-red-800 relative overflow-hidden`}>
        {/* Mastercard distinctive circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center -space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full opacity-60"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
          </div>
        </div>
        <div className={`text-white font-bold ${textSizes[size]} relative z-10 drop-shadow-lg`}>
          {size === 'sm' ? 'MC' : 'MC'}
        </div>
      </div>
    ),
    equity_bank: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center shadow-lg border border-blue-900`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'E' : 'EQT'}
        </div>
      </div>
    ),
    rawbank: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center shadow-lg border border-yellow-700`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight drop-shadow-md`}>
          {size === 'sm' ? 'R' : 'RAW'}
        </div>
      </div>
    ),
    tmb: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center shadow-lg border border-green-900`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'T' : 'TMB'}
        </div>
      </div>
    ),
    biac: (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-purple-700 to-purple-800 rounded-lg flex items-center justify-center shadow-lg border border-purple-800`}>
        <div className={`text-white font-bold ${textSizes[size]} tracking-tight`}>
          {size === 'sm' ? 'B' : 'BIAC'}
        </div>
      </div>
    )
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {logos[type]}
    </motion.div>
  );
}

interface PaymentMethodCardProps {
  method: {
    id: string;
    name: string;
    type: string;
    logoType: 'orange_money' | 'airtel_money' | 'mpesa' | 'visa' | 'mastercard' | 'equity_bank' | 'rawbank' | 'tmb' | 'biac';
    description: string;
    fees: number;
    processingTime: string;
    supported: boolean;
    popular?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function PaymentMethodCard({ method, isSelected, onSelect, disabled = false }: PaymentMethodCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-kongo-lime bg-surface-kongo-lime-light shadow-kongo-lime' 
          : 'border-border-primary hover:border-kongo-lime/50 bg-surface-elevated shadow-base hover:shadow-md'
        }
        ${!method.supported || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${method.popular ? 'ring-2 ring-kongo-lime/30' : ''}
      `}
      onClick={!disabled && method.supported ? onSelect : undefined}
    >
      {/* Enhanced Popular Badge with Better Contrast */}
      {method.popular && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-3 -right-3 bg-kongo-black text-kongo-lime border border-kongo-lime text-xs font-bold px-3 py-1 rounded-full shadow-lg"
        >
          ⭐ Populaire
        </motion.div>
      )}

      <div className="flex items-center space-x-4">
        {/* Enhanced Custom Radio Button */}
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative
          ${isSelected ? 'border-kongo-lime bg-kongo-lime shadow-sm' : 'border-border-strong bg-surface-primary'}
        `}>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="w-3 h-3 bg-kongo-black rounded-full"
            />
          )}
        </div>

        {/* Payment Logo */}
        <PaymentLogo type={method.logoType} size="md" />

        {/* Method Details with Enhanced Contrast */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-body font-semibold text-kongo-black">
              {method.name}
            </div>
            {!method.supported && (
              <span className="bg-error/10 text-error border border-error/20 px-2 py-1 rounded-full text-xs font-medium">
                Indisponible
              </span>
            )}
          </div>
          
          <div className="text-body-small text-secondary mb-3 leading-relaxed">
            {method.description}
          </div>
          
          {/* Enhanced Indicators with Better Contrast */}
          <div className="flex items-center space-x-6 text-body-xs">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-tertiary font-medium">
                  Frais: <span className="text-kongo-black font-semibold">{(method.fees * 100).toFixed(1)}%</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-tertiary font-medium">
                  <span className="text-kongo-black font-semibold">{method.processingTime}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="text-kongo-lime bg-kongo-lime/10 p-2 rounded-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface SecurityBadgeProps {
  type: 'ssl' | 'pci' | 'verified' | 'instant';
  className?: string;
}

export function SecurityBadge({ type, className = '' }: SecurityBadgeProps) {
  const badges = {
    ssl: (
      <div className={`inline-flex items-center space-x-2 bg-success/10 text-success border border-success/30 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>SSL Sécurisé</span>
      </div>
    ),
    pci: (
      <div className={`inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>PCI Conforme</span>
      </div>
    ),
    verified: (
      <div className={`inline-flex items-center space-x-2 bg-kongo-lime/15 text-kongo-black border border-kongo-lime/40 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>KonGO Vérifié</span>
      </div>
    ),
    instant: (
      <div className={`inline-flex items-center space-x-2 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded-full text-xs font-semibold shadow-sm ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>Instantané</span>
      </div>
    )
  };

  return badges[type];
}

// New Enhanced Bonus Badge Component for Payment Methods
interface BonusBadgeProps {
  text: string;
  className?: string;
}

export function BonusBadge({ text, className = '' }: BonusBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center space-x-2 bg-kongo-lime/20 text-kongo-black border border-kongo-lime/40 px-3 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>{text}</span>
    </motion.div>
  );
}

// Enhanced Processing Status Component
interface ProcessingStatusProps {
  status: 'waiting' | 'processing' | 'success' | 'error';
  message: string;
  className?: string;
}

export function ProcessingStatus({ status, message, className = '' }: ProcessingStatusProps) {
  const statusStyles = {
    waiting: 'bg-info/10 text-info border-info/30',
    processing: 'bg-kongo-lime/10 text-kongo-black border-kongo-lime/30',
    success: 'bg-success/10 text-success border-success/30',
    error: 'bg-error/10 text-error border-error/30'
  };

  const icons = {
    waiting: (
      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    processing: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ),
    success: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-3 border px-4 py-3 rounded-lg text-sm font-medium ${statusStyles[status]} ${className}`}
    >
      {icons[status]}
      <span>{message}</span>
    </motion.div>
  );
}
