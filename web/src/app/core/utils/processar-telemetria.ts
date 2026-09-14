import { TelemetriaLog } from '../models/pirep.models';

export interface EventoVoo {
  timestamp: string;
  texto: string;
}

const LIMIAR_GEAR_ALTO = 70;
const LIMIAR_MUDANCA_FLAP = 4;
const LIMIAR_VS_ESTAVEL = 150;
const DURACAO_MINIMA_CRUZEIRO_MS = 30000;
const ALTITUDE_APPROACH_FT = 10000;
const ALTITUDE_FINAL_FT = 1500;

export function gerarEventosDoVoo(logsOrdenados: TelemetriaLog[]): EventoVoo[] {
  if (logsOrdenados.length === 0) return [];

  const eventos: EventoVoo[] = [];
  const primeiro = logsOrdenados[0];

  if (primeiro.aeronaveNome) {
    eventos.push({ timestamp: primeiro.registradoEmUtc, texto: `Usando ${primeiro.aeronaveNome}` });
  }
  if (primeiro.squawk) {
    eventos.push({ timestamp: primeiro.registradoEmUtc, texto: `Transponder code set to ${primeiro.squawk}` });
  }
  if (primeiro.frequenciaComAtiva) {
    eventos.push({ timestamp: primeiro.registradoEmUtc, texto: `COM1 active frequency set to ${primeiro.frequenciaComAtiva}` });
  }

  let ultimoFlap = Math.round(primeiro.flapsPercentual);
  let gearEmbaixo = primeiro.trainPousoPercentual >= LIMIAR_GEAR_ALTO;
  let spoilersArmadoAnterior = primeiro.spoilersArmado;
  let jaDecolou = !primeiro.estaNoSolo;
  let jaTocou = false;
  let emCruzeiro = false;
  let emApproach = false;
  let emFinal = false;
  let inicioPlatoUtc: string | null = null;
  let altitudeMaxima = primeiro.altitudePes;

  for (let i = 1; i < logsOrdenados.length; i++) {
    const atual = logsOrdenados[i];
    const anterior = logsOrdenados[i - 1];

    if (atual.squawk && atual.squawk !== anterior.squawk) {
      eventos.push({ timestamp: atual.registradoEmUtc, texto: `Transponder code set to ${atual.squawk}` });
    }

    if (atual.frequenciaComAtiva && atual.frequenciaComAtiva !== anterior.frequenciaComAtiva) {
      eventos.push({ timestamp: atual.registradoEmUtc, texto: `COM1 active frequency set to ${atual.frequenciaComAtiva}` });
    }

    const flapAtual = Math.round(atual.flapsPercentual);
    if (Math.abs(flapAtual - ultimoFlap) >= LIMIAR_MUDANCA_FLAP) {
      eventos.push({
        timestamp: atual.registradoEmUtc,
        texto: `Flaps set to ${flapAtual}% at ${Math.round(atual.altitudePes)} ft at ${Math.round(atual.velocidadeNos)} kts`,
      });
      ultimoFlap = flapAtual;
    }

    const gearAgora = atual.trainPousoPercentual >= LIMIAR_GEAR_ALTO;
    const gearAntes = atual.trainPousoPercentual <= 30;
    if (gearAgora && !gearEmbaixo) {
      eventos.push({ timestamp: atual.registradoEmUtc, texto: `Gear lever lowered, ${Math.round(atual.velocidadeNos)} kts` });
      gearEmbaixo = true;
    } else if (gearAntes && gearEmbaixo) {
      eventos.push({ timestamp: atual.registradoEmUtc, texto: `Gear lever raised, ${Math.round(atual.velocidadeNos)} kts` });
      gearEmbaixo = false;
    }

    if (atual.spoilersArmado !== spoilersArmadoAnterior) {
      eventos.push({ timestamp: atual.registradoEmUtc, texto: atual.spoilersArmado ? 'Spoilers armed' : 'Spoilers disarmed' });
      spoilersArmadoAnterior = atual.spoilersArmado;
    }

    if (!jaDecolou && !atual.estaNoSolo) {
      eventos.push({
        timestamp: atual.registradoEmUtc,
        texto: `Liftoff at ${Math.round(atual.velocidadeNos)} kts, ${atual.pitch.toFixed(0)}° pitch, ${atual.bank.toFixed(0)}° bank`,
      });
      jaDecolou = true;
    }

    if (jaDecolou && !jaTocou && atual.estaNoSolo) {
      eventos.push({
        timestamp: atual.registradoEmUtc,
        texto: `Touched down at ${Math.round(atual.velocidadeVerticalFpm)} fpm, ${atual.pitch.toFixed(0)}° pitch, ${atual.bank.toFixed(0)}° bank`,
      });
      jaTocou = true;
    }

    if (jaDecolou && !jaTocou) {
      if (atual.altitudePes > altitudeMaxima) altitudeMaxima = atual.altitudePes;

      const vsEstavel = Math.abs(atual.velocidadeVerticalFpm) < LIMIAR_VS_ESTAVEL;
      const emDescida = atual.velocidadeVerticalFpm < -LIMIAR_VS_ESTAVEL;

      if (vsEstavel && !emCruzeiro && !emApproach) {
        inicioPlatoUtc ??= atual.registradoEmUtc;
        const decorridoMs = new Date(atual.registradoEmUtc).getTime() - new Date(inicioPlatoUtc).getTime();
        if (decorridoMs >= DURACAO_MINIMA_CRUZEIRO_MS) {
          eventos.push({ timestamp: atual.registradoEmUtc, texto: `Cruising at ${Math.round(atual.altitudePes)} ft` });
          emCruzeiro = true;
        }
      } else if (!vsEstavel) {
        inicioPlatoUtc = null;
      }

      if (emCruzeiro && emDescida) {
        eventos.push({ timestamp: atual.registradoEmUtc, texto: `Descending from ${Math.round(altitudeMaxima)} ft` });
        emCruzeiro = false;
      }

      if (!emApproach && atual.altitudePes <= ALTITUDE_APPROACH_FT && emDescida) {
        eventos.push({ timestamp: atual.registradoEmUtc, texto: `Approach started at ${Math.round(atual.altitudePes)} ft` });
        emApproach = true;
      }

      if (emApproach && !emFinal && atual.altitudePes <= ALTITUDE_FINAL_FT && gearEmbaixo) {
        eventos.push({
          timestamp: atual.registradoEmUtc,
          texto: `On final at ${Math.round(atual.altitudePes)} ft at ${Math.round(atual.velocidadeNos)} kts, ${atual.pitch.toFixed(0)}° pitch, ${atual.bank.toFixed(0)}° bank`,
        });
        emFinal = true;
      }
    }
  }

  const ultimo = logsOrdenados[logsOrdenados.length - 1];
  if (jaTocou) {
    eventos.push({ timestamp: ultimo.registradoEmUtc, texto: 'Taxiing to gate' });
  }

  return eventos;
}