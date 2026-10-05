import React from 'react';

// Único punto de entrada a los logos oficiales (public/brand/, copias de public/logos/).
type BrandLogoProps = { className?: string } & (
  | { variant: 'muni-limpia-h'; tone?: 'color' }
  | { variant: 'escudo' | 'municipalidad-h'; tone?: 'color' | 'blanco' }
  | { variant: 'emblema'; tone?: 'blanco' }
);

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant, tone, className }) => {
  const file =
    variant === 'muni-limpia-h' ? 'muni-limpia-h'
    : variant === 'emblema' ? 'emblema-blanco'
    : `${variant}-${tone ?? 'color'}`;
  const alt = variant === 'muni-limpia-h' ? 'Muni Limpia' : 'Municipalidad de la Ciudad de Corrientes';

  return <img src={`/brand/${file}.svg`} alt={alt} className={className} />;
};
