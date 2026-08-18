import { Button } from "../ui/button";

interface NavigationItem {
  id: string;
  label: string;
  active: boolean;
}

interface HeaderNavigationProps {
  items: NavigationItem[];
  onNavigate: (page: string) => void;
}

export function HeaderNavigation({ items, onNavigate }: HeaderNavigationProps) {
  return (
    <nav className="flex items-center space-x-1">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <Button
            variant="ghost"
            onClick={() => onNavigate(item.id)}
            className={`
              relative h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150
              ${item.active
                ? "bg-surface-kongo-lime-light text-kongo-black hover:bg-surface-kongo-lime-medium"
                : "text-secondary hover:bg-surface-hover hover:text-kongo-black"
              }
            `}
          >
            {item.label}
          </Button>

          {item.active && (
            <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-kongo-lime" />
          )}
        </div>
      ))}
    </nav>
  );
}
