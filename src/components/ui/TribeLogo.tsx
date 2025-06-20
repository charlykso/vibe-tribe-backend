import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface TribeLogoProps {
  className?: string;
  alt?: string;
}

export const TribeLogo: React.FC<TribeLogoProps> = ({ 
  className = "h-12 w-auto", 
  alt = "Tribe" 
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return <div className={className} />;
  }

  // Use light logo for dark theme, dark logo for light theme
  const logoSrc = resolvedTheme === 'dark' 
    ? '/Tribe-svg-light.svg'  // Light logo for dark mode
    : '/Tribe-svg-dark.svg';  // Dark logo for light mode

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
    />
  );
};
