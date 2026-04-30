/**
 * Modelo central de datos para Lingua-Inclusion
 * Representa una palabra/concepto con soporte multilingüe y multimedia
 */

export type Idioma = 'es' | 'qu' | 'ay';
export type PerfilAccesibilidad = 'estandar' | 'alto-contraste' | 'solo-audio' | 'pictogramas';
export type Categoria =
  | 'salud'
  | 'educacion'
  | 'derechos'
  | 'emergencias'
  | 'servicios'
  | 'familia'
  | 'naturaleza'
  | 'numeros';

export interface TraduccionIdioma {
  termino: string;
  definicion: string;
  pronunciacion?: string; // Guía fonética simplificada
  ejemploUso?: string;
}

export interface MultimediaPalabra {
  audioEs?: string;
  audioQu?: string;
  audioAy?: string;
  emoji: string;       // Emoji representativo de la palabra (pictograma universal)
}

export interface Palabra {
  id: string;
  categoria: Categoria;
  es: TraduccionIdioma;
  qu: TraduccionIdioma;
  ay: TraduccionIdioma;
  multimedia: MultimediaPalabra;
  etiquetas: string[]; // Para búsqueda adicional
  nivelDificultad: 1 | 2 | 3; // 1=básico, 2=intermedio, 3=avanzado
}

export interface CategoriaConfig {
  id: Categoria;
  color: string;
  colorContraste: string; // Color para modo alto contraste
  icono: string;          // Nombre del ícono Material
  pictograma: string;     // Ruta al pictograma SVG
  labelEs: string;
  labelQu: string;
  labelAy: string;
}

export interface EstadoApp {
  idioma: Idioma;
  perfil: PerfilAccesibilidad;
  volumenAudio: number;
  velocidadTTS: number;
  tamanoFuente: 'normal' | 'grande' | 'extra-grande';
}

export const CATEGORIAS_CONFIG: Record<Categoria, CategoriaConfig> = {
  salud: {
    id: 'salud',
    color: '#E53935',
    colorContraste: '#FF1744',
    icono: '🏥',
    pictograma: 'assets/pictogramas/salud.svg',
    labelEs: 'Salud',
    labelQu: 'Hampiy',
    labelAy: 'Jakhusiña',
  },
  educacion: {
    id: 'educacion',
    color: '#1E88E5',
    colorContraste: '#2979FF',
    icono: '📚',
    pictograma: 'assets/pictogramas/educacion.svg',
    labelEs: 'Educación',
    labelQu: 'Yachay',
    labelAy: 'Yatiqaña',
  },
  derechos: {
    id: 'derechos',
    color: '#8E24AA',
    colorContraste: '#D500F9',
    icono: '⚖️',
    pictograma: 'assets/pictogramas/derechos.svg',
    labelEs: 'Derechos',
    labelQu: 'Derechokuna',
    labelAy: 'Derechonaka',
  },
  emergencias: {
    id: 'emergencias',
    color: '#F4511E',
    colorContraste: '#FF3D00',
    icono: '🚨',
    pictograma: 'assets/pictogramas/emergencias.svg',
    labelEs: 'Emergencias',
    labelQu: 'Qhipa',
    labelAy: 'Phaxsi',
  },
  servicios: {
    id: 'servicios',
    color: '#00897B',
    colorContraste: '#00E5FF',
    icono: '🏛️',
    pictograma: 'assets/pictogramas/servicios.svg',
    labelEs: 'Servicios',
    labelQu: 'Serviciokuna',
    labelAy: 'Servicionaka',
  },
  familia: {
    id: 'familia',
    color: '#F9A825',
    colorContraste: '#FFD600',
    icono: '👨‍👩‍👧',
    pictograma: 'assets/pictogramas/familia.svg',
    labelEs: 'Familia',
    labelQu: 'Ayllu',
    labelAy: 'Aylli',
  },
  naturaleza: {
    id: 'naturaleza',
    color: '#43A047',
    colorContraste: '#00E676',
    icono: '🌿',
    pictograma: 'assets/pictogramas/naturaleza.svg',
    labelEs: 'Naturaleza',
    labelQu: 'Pachamama',
    labelAy: 'Pachamama',
  },
  numeros: {
    id: 'numeros',
    color: '#546E7A',
    colorContraste: '#90A4AE',
    icono: '🔢',
    pictograma: 'assets/pictogramas/numeros.svg',
    labelEs: 'Números',
    labelQu: 'Yupay',
    labelAy: 'Pä',
  },
};
