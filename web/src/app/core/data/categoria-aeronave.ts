export type CategoriaAeronave = 'monomotor' | 'bimotor' | 'executivo' | 'regional' | 'narrowbody' | 'widebody';

const PREFIXOS_WIDEBODY = ['A33', 'A34', 'A35', 'A38', 'B74', 'B76', 'B77', 'B78', 'MD1'];
const PREFIXOS_NARROWBODY = ['A18', 'A19', 'A20', 'A21', 'B73', 'B37', 'B38', 'B39'];
const PREFIXOS_REGIONAL = ['E17', 'E19', 'E29', 'CRJ', 'AT7', 'DH8', 'SF3', 'J32'];
const PREFIXOS_EXECUTIVO = ['C56', 'C68', 'C70', 'C75', 'GLF', 'CL3', 'CL6', 'FA7', 'FA8', 'LJ3', 'LJ4', 'PC12', 'PC24'];
const PREFIXOS_BIMOTOR = ['BE2', 'BE9', 'C31', 'C34', 'DA42', 'PA34', 'PA44'];

export function categorizarAeronave(codigoIcao: string | null | undefined): CategoriaAeronave {
  if (!codigoIcao) return 'narrowbody';
  const codigo = codigoIcao.toUpperCase();

  if (PREFIXOS_WIDEBODY.some(p => codigo.startsWith(p))) return 'widebody';
  if (PREFIXOS_NARROWBODY.some(p => codigo.startsWith(p))) return 'narrowbody';
  if (PREFIXOS_REGIONAL.some(p => codigo.startsWith(p))) return 'regional';
  if (PREFIXOS_EXECUTIVO.some(p => codigo.startsWith(p))) return 'executivo';
  if (PREFIXOS_BIMOTOR.some(p => codigo.startsWith(p))) return 'bimotor';
  if (['C172', 'C152', 'PA28', 'PA32', 'SR22', 'DA40'].includes(codigo)) return 'monomotor';

  return 'narrowbody';
}

export function tamanhoIconePorCategoria(categoria: CategoriaAeronave): number {
  switch (categoria) {
    case 'monomotor': return 14;
    case 'bimotor': return 16;
    case 'executivo': return 17;
    case 'regional': return 19;
    case 'narrowbody': return 22;
    case 'widebody': return 28;
  }
}

export function svgAeronavePorCategoria(categoria: CategoriaAeronave, cor: string): string {
  switch (categoria) {
    case 'monomotor':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="11" y="2" width="2" height="18" fill="${cor}"/>
        <rect x="3" y="10" width="18" height="1.6" fill="${cor}"/>
        <rect x="8" y="18.5" width="8" height="1.4" fill="${cor}"/>
      </svg>`;

    case 'bimotor':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="10.7" y="2" width="2.6" height="18" fill="${cor}"/>
        <rect x="2" y="9.6" width="20" height="1.8" fill="${cor}"/>
        <circle cx="7" cy="10.5" r="1.4" fill="${cor}"/>
        <circle cx="17" cy="10.5" r="1.4" fill="${cor}"/>
        <rect x="7.5" y="18.5" width="9" height="1.4" fill="${cor}"/>
      </svg>`;

    case 'executivo':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,1 13.5,4 13.5,18 10.5,18 10.5,4" fill="${cor}"/>
        <polygon points="12,8 3,15 3,16.6 12,12.5" fill="${cor}"/>
        <polygon points="12,8 21,15 21,16.6 12,12.5" fill="${cor}"/>
        <polygon points="12,15.5 8,19.5 8,20.5 12,18.5" fill="${cor}"/>
        <polygon points="12,15.5 16,19.5 16,20.5 12,18.5" fill="${cor}"/>
      </svg>`;

    case 'regional':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,0.5 14,4 14,19 10,19 10,4" fill="${cor}"/>
        <polygon points="12,7 1.5,14.5 1.5,16.5 12,11.5" fill="${cor}"/>
        <polygon points="12,7 22.5,14.5 22.5,16.5 12,11.5" fill="${cor}"/>
        <polygon points="12,16 7.5,20.5 7.5,21.5 12,19.5" fill="${cor}"/>
        <polygon points="12,16 16.5,20.5 16.5,21.5 12,19.5" fill="${cor}"/>
      </svg>`;

    case 'narrowbody':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,0 14.5,4.5 14.5,20 9.5,20 9.5,4.5" fill="${cor}"/>
        <polygon points="12,6 0.5,15 0.5,17.5 12,11.5" fill="${cor}"/>
        <polygon points="12,6 23.5,15 23.5,17.5 12,11.5" fill="${cor}"/>
        <polygon points="12,16.5 7,21.5 7,23 12,20" fill="${cor}"/>
        <polygon points="12,16.5 17,21.5 17,23 12,20" fill="${cor}"/>
      </svg>`;

    case 'widebody':
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,0 15.5,5 15.5,20 8.5,20 8.5,5" fill="${cor}"/>
        <polygon points="12,5.5 -1,15.5 -1,18.5 12,11.5" fill="${cor}"/>
        <polygon points="12,5.5 25,15.5 25,18.5 12,11.5" fill="${cor}"/>
        <circle cx="6" cy="13.5" r="1.3" fill="#0a0a0f"/>
        <circle cx="18" cy="13.5" r="1.3" fill="#0a0a0f"/>
        <polygon points="12,17 6.5,22.5 6.5,24 12,20.5" fill="${cor}"/>
        <polygon points="12,17 17.5,22.5 17.5,24 12,20.5" fill="${cor}"/>
      </svg>`;
  }
}