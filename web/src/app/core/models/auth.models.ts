export interface PilotoResumo {
  id: number;
  nome: string;
  callsign: string;
  rating: number;
  pontosTotais: number;
  localizacaoAtualIcao: string | null;
}

export interface AuthResponse {
  token: string;
  expiraEm: string;
  refreshToken: string;
  piloto: PilotoResumo;
}

export interface RegistroPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}