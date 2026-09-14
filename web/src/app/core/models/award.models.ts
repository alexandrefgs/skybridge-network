export interface Award {
  id: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
}

export interface NovoAwardPayload {
  nome: string;
  descricao: string | null;
}