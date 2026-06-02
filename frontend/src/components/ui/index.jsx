import React from 'react';
import { cn } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = React.forwardRef(({ children, variant = 'primary', size = 'md', loading, className, ...props }, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-850';
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-400 text-white focus:ring-brand-400 shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5',
    secondary: 'bg-dark-600 hover:bg-dark-500 text-white border border-white/10 hover:border-white/20 focus:ring-white/20',
    danger: 'bg-accent-red/10 hover:bg-accent-red text-accent-red hover:text-white border border-accent-red/30 hover:border-accent-red focus:ring-accent-red/40',
    ghost: 'hover:bg-white/5 text-slate-400 hover:text-white focus:ring-white/20',
    outline: 'border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 hover:border-brand-500 focus:ring-brand-500/40',
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base', icon: 'p-2.5' };
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(({ label, error, hint, prefix, suffix, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-400 text-sm select-none">{prefix}</span>}
      <input
        ref={ref}
        className={cn(
          'input-field',
          prefix && 'pl-8',
          suffix && 'pr-10',
          error && 'border-accent-red/60 focus:ring-accent-red/40',
          className
        )}
        {...props}
      />
      {suffix && <span className="absolute right-3 text-slate-400 text-sm select-none">{suffix}</span>}
    </div>
    {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, className }) => (
  <Loader2 size={size} className={cn('animate-spin text-brand-500', className)} />
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-white/10 text-slate-300',
    success: 'bg-accent-green/10 text-accent-green',
    danger: 'bg-accent-red/10 text-accent-red',
    warning: 'bg-accent-gold/10 text-accent-gold',
    info: 'bg-accent-blue/10 text-accent-blue',
    brand: 'bg-brand-500/10 text-brand-400',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono', variants[variant], className)}>
      {children}
    </span>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className, hover, ...props }) => (
  <div className={cn('card', hover && 'glass-hover cursor-pointer', className)} {...props}>
    {children}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton', className)} {...props} />
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn('relative w-full glass rounded-2xl shadow-2xl', sizes[size])}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────
export const Table = ({ columns, data, loading, emptyMessage = 'No data' }) => (
  <div className="overflow-x-auto no-scrollbar">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/5">
          {columns.map((col) => (
            <th key={col.key} className={cn('py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider', col.className)}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-white/5">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))
        ) : data?.length === 0 ? (
          <tr><td colSpan={columns.length} className="py-12 text-center text-slate-500">{emptyMessage}</td></tr>
        ) : (
          data?.map((row, i) => (
            <tr key={row._id || i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('py-3 px-4', col.cellClassName)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ─── OTP Input ────────────────────────────────────────────────────────────────
export const OtpInput = ({ value, onChange, length = 6 }) => {
  const inputs = React.useRef([]);
  const vals = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (e, idx) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...vals];
    arr[idx] = v;
    onChange(arr.join(''));
    if (v && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !vals[idx] && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={vals[idx]}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={cn(
            'w-12 h-14 text-center text-xl font-mono font-bold bg-dark-700 border rounded-xl',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
            vals[idx] ? 'border-brand-500/60 text-white' : 'border-white/10 text-white'
          )}
        />
      ))}
    </div>
  );
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export const Tooltip = ({ children, content }) => (
  <div className="relative group inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-dark-500 border border-white/10 rounded-lg text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-500" />
    </div>
  </div>
);
