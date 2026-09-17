'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Viewer3D } from '@/components/viewer3d/Viewer3D';
import { salvarFichaPeca, type FichaPeca } from '@/lib/admin/productActions';

const TIPOS = ['corrente', 'pulseira', 'anel', 'pingente'];
const ELOS = ['cubano', 'grumet', 'veneziana', 'cartier', 'baiana'];
const ACABAMENTOS = ['polido', 'escovado', 'oxidado'];
const PINGENTES = ['', 'cruz', 'placa', 'medalha'];

export function PecaFicha({ productId, inicial }: { productId: string; inicial: FichaPeca }) {
  const router = useRouter();
  const [form, setForm] = useState<FichaPeca>(inicial);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function campo<K extends keyof FichaPeca>(k: K, v: FichaPeca[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSalvo(false);
  }

  const usaElo = form.buildTipo === 'corrente' || form.buildTipo === 'pulseira';
  const usaMedida = form.buildTipo !== 'pingente';

  return (
    <div className="adm-grid-2" style={{ alignItems: 'start' }}>
      <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 16 }}>
        <p style={{ fontSize: 12.5, color: 'var(--tinta-2)', margin: 0 }}>Estes são os parâmetros que alimentam o visualizador 3D do site e os filtros do catálogo.</p>

        <div className="adm-grid-2">
          <div className="adm-field">
            <label className="adm-label" htmlFor="tipo">Tipo</label>
            <select id="tipo" className="adm-select" value={form.buildTipo} onChange={(e) => campo('buildTipo', e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {usaElo ? (
            <div className="adm-field">
              <label className="adm-label" htmlFor="elo">Elo</label>
              <select id="elo" className="adm-select" value={form.buildElo || ''} onChange={(e) => campo('buildElo', e.target.value || null)}>
                <option value="">—</option>
                {ELOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="adm-grid-2">
          <div className="adm-field">
            <label className="adm-label" htmlFor="esp">Espessura (mm)</label>
            <input id="esp" className="adm-input" inputMode="decimal" value={String(form.buildEsp).replace('.', ',')} onChange={(e) => campo('buildEsp', parseFloat(e.target.value.replace(',', '.')) || 0)} />
          </div>
          {usaMedida ? (
            <div className="adm-field">
              <label className="adm-label" htmlFor="medida">{form.buildTipo === 'anel' ? 'Aro' : 'Medida (cm)'}</label>
              <input id="medida" className="adm-input" inputMode="numeric" value={form.buildMedida ?? ''} onChange={(e) => campo('buildMedida', parseInt(e.target.value, 10) || null)} />
            </div>
          ) : null}
        </div>

        <div className="adm-grid-2">
          <div className="adm-field">
            <label className="adm-label" htmlFor="acab">Acabamento</label>
            <select id="acab" className="adm-select" value={form.buildAcabamento || 'polido'} onChange={(e) => campo('buildAcabamento', e.target.value)}>
              {ACABAMENTOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="ping">Pingente</label>
            <select id="ping" className="adm-select" value={form.buildPingente || ''} onChange={(e) => campo('buildPingente', e.target.value || null)}>
              {PINGENTES.map((t) => (
                <option key={t} value={t}>{t || 'sem pingente'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="grav">Gravação</label>
          <input id="grav" className="adm-input" value={form.buildGravacao || ''} onChange={(e) => campo('buildGravacao', e.target.value || null)} placeholder="deixe vazio se não tem" />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="erk-btn erk-btn--p"
            disabled={pendente}
            onClick={() =>
              start(async () => {
                await salvarFichaPeca(productId, form);
                setSalvo(true);
                router.refresh();
              })
            }
          >
            {pendente ? 'Salvando…' : 'Salvar ficha'}
          </button>
          {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Ficha salva.</span> : null}
        </div>
      </div>

      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 12 }}>
          Prévia 3D ao vivo
        </div>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--fundo-3)', minHeight: 320 }}>
          <Viewer3D
            spec={{
              tipo: form.buildTipo as 'corrente' | 'pulseira' | 'anel' | 'bracelete' | 'brinco' | 'pingente',
              elo: form.buildElo || undefined,
              esp: form.buildEsp,
              medida: form.buildMedida ?? undefined,
              acabamento: (form.buildAcabamento as 'polido' | 'escovado' | 'oxidado') || 'polido',
              pingente: form.buildPingente || undefined,
              gravacao: form.buildGravacao || undefined,
            }}
            style={{ height: 320 }}
          />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--tinta-3)', marginTop: 10 }}>É o mesmo visualizador que o cliente vê no site.</p>
      </div>
    </div>
  );
}
