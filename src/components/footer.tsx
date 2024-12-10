import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-3 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-8 text-sm">
          <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            NITRINOnet E-passport
          </span>
          <div className="flex items-center gap-6 text-muted-foreground">
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" />
              <a href="mailto:popov@nitshop.ru" className="hover:underline">
                popov@nitshop.ru
              </a>
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              <a href="tel:+73532305500" className="hover:underline">
                +7(3532) 305-500
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
