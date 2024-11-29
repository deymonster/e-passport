import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-muted py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NITRINOnet E-Passport. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Developed by NITRINOnet Deymonster | Version 1.0.0 | 
            
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Admin
              </Link>
            
          </p>
        </div>
      </div>
    </footer>
  )
}
