import { useState, forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  allowMultiple?: boolean;
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, allowMultiple: _allowMultiple, children, ...props }, ref) => (
    <div ref={ref} className={clsx('accordion', className)} {...props}>
      {children}
    </div>
  )
);

Accordion.displayName = 'Accordion';

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, title, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const itemId = props.id || title.replace(/\s+/g, '-').toLowerCase();

    return (
      <div ref={ref} className={clsx('accordion-item', className)} {...props}>
        <button
          type="button"
          id={`${itemId}-trigger`}
          className="accordion-trigger"
          aria-expanded={isOpen}
          aria-controls={`${itemId}-content`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div
          id={`${itemId}-content`}
          role="region"
          aria-labelledby={`${itemId}-trigger`}
          className={clsx('accordion-content', { hidden: !isOpen })}
          hidden={!isOpen}
        >
          {children}
        </div>
      </div>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
