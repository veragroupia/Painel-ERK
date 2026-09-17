'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { GiroViewer } from './GiroViewer';
import { ConfirmButton } from './ConfirmButton';
import { adicionarFoto, removerFoto, definirCapa, reordenarFotos, decidirModelo3d, definirUrlModelo3d } from '@/lib/admin/productActions';

type Foto = { id: string; url: string; capa?: boolean };
type QuadroLocal = { nome: string; url: string; largura: number; altura: number; brilho: number; progresso: number };

/** lê dimensões e brilho médio de um arquivo solto, pra montar os avisos do giro */
function lerQuadro(file: File): Promise<QuadroLocal> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const lado = 32;
      canvas.width = lado;
      canvas.height = lado;
      const ctx = canvas.getContext('2d');
      let brilho = 0;
      if (ctx) {
        ctx.drawImage(img, 0, 0, lado, lado);
        const { data } = ctx.getImageData(0, 0, lado, lado);
        let soma = 0;
        for (let i = 0; i < data.length; i += 4) soma += (data[i] + data[i + 1] + data[i + 2]) / 3;
        brilho = soma / (data.length / 4);
      }
      resolve({ nome: file.name, url, largura: img.naturalWidth, altura: img.naturalHeight, brilho, progresso: 100 });
    };
    img.onerror = () => resolve({ nome: file.name, url, largura: 0, altura: 0, brilho: 0, progresso: 100 });
    img.src = url;
  });
}

function ordenarPorNome(a: QuadroLocal, b: QuadroLocal) {
  return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

export function PecaMidia({
  productId,
  galeria,
  giro,
  modelo3dStatus,
  modelo3dUrl,
  fotoFallback,
}: {
  productId: string;
  galeria: Foto[];
  giro: Foto[];
  modelo3dStatus: string;
  modelo3dUrl: string | null;
  fotoFallback: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [urlNova, setUrlNova] = useState('');
  const [erro, setErro] = useState('');
  const [sobre, setSobre] = useState(false);
  const [locais, setLocais] = useState<QuadroLocal[]>([]);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [url3d, setUrl3d] = useState(modelo3dUrl || '');

  const quadrosSalvos = giro.map((g) => g.url);

  const avisos: string[] = [];
  if (locais.length > 0) {
    if (locais.length < 24) avisos.push(`só ${locais.length} quadros, o giro vai ficar travado`);
    const brilhos = locais.map((q) => q.brilho);
    const variacao = Math.max(...brilhos) - Math.min(...brilhos);
    if (variacao > 28) avisos.push('o brilho varia muito entre os quadros — a exposição pode ter ficado no automático');
    const tamanhos = new Map<string, number[]>();
    locais.forEach((q, i) => {
      const chave = `${q.largura}x${q.altura}`;
      tamanhos.set(chave, [...(tamanhos.get(chave) || []), i + 1]);
    });
    if (tamanhos.size > 1) {
      const [, forasteiros] = [...tamanhos.entries()].sort((a, b) => a[1].length - b[1].length)[0];
      avisos.push(`o quadro ${forasteiros[0]} tem tamanho diferente dos outros`);
    }
  }

  async function receberArquivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const imagens = [...files].filter((f) => f.type.startsWith('image/'));
    const lidos = await Promise.all(imagens.map(lerQuadro));
    setLocais(lidos.sort(ordenarPorNome));
  }

  function soltarGaleria(alvoId: string) {
    if (!arrastando || arrastando === alvoId) return;
    const ids = galeria.map((f) => f.id);
    const de = ids.indexOf(arrastando);
    const para = ids.indexOf(alvoId);
    const [movido] = ids.splice(de, 1);
    ids.splice(para, 0, movido);
    setArrastando(null);
    start(async () => {
      await reordenarFotos(productId, ids);
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* ---------- galeria ---------- */}
      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 4 }}>
          Galeria de fotos
        </div>
        <p style={{ fontSize: 12, color: 'var(--tinta-3)', margin: '0 0 14px' }}>Arraste para reordenar. A primeira marcada como capa é a que aparece no catálogo.</p>

        {galeria.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {galeria.map((f) => (
              <div
                key={f.id}
                draggable
                onDragStart={() => setArrastando(f.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarGaleria(f.id)}
                style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: f.capa ? '2px solid var(--tinta)' : '1px solid var(--linha)', cursor: 'grab' }}
              >
                <img src={f.url} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 'auto 0 0 0', display: 'flex', gap: 4, padding: 6, background: 'linear-gradient(transparent, rgba(13,15,18,.9))' }}>
                  {f.capa ? (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tinta)', letterSpacing: '.06em' }}>CAPA</span>
                  ) : (
                    <button
                      type="button"
                      style={{ fontSize: 10.5, color: 'var(--tinta-2)', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
                      onClick={() => start(async () => { await definirCapa(f.id); router.refresh(); })}
                    >
                      usar de capa
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remover foto"
                    style={{ marginLeft: 'auto', color: 'var(--tinta-2)', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
                    onClick={() => start(async () => { await removerFoto(f.id); router.refresh(); })}
                  >
                    <Icon name="adm_lixeira" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nenhuma foto ainda. Cole o endereço da primeira abaixo.</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input className="adm-input adm-input--sm" style={{ flex: '1 1 260px' }} value={urlNova} onChange={(e) => setUrlNova(e.target.value)} placeholder="https://… endereço da foto" />
          <button
            type="button"
            className="erk-btn erk-btn--s erk-btn--sm"
            onClick={() =>
              start(async () => {
                try {
                  setErro('');
                  await adicionarFoto(productId, urlNova);
                  setUrlNova('');
                  router.refresh();
                } catch (e) {
                  setErro((e as Error).message);
                }
              })
            }
          >
            Adicionar foto
          </button>
        </div>
        {erro ? <p style={{ color: 'var(--acento)', fontSize: 12.5, marginTop: 8 }}>{erro}</p> : null}
      </div>

      {/* ---------- giro 360 ---------- */}
      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 14 }}>
          Giro 360°
        </div>

        {quadrosSalvos.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <GiroViewer quadros={quadrosSalvos} />
            <p style={{ fontSize: 12, color: 'var(--tinta-3)', marginTop: 8 }}>{quadrosSalvos.length} quadros salvos nesta peça.</p>
          </div>
        ) : null}

        <div
          className={'adm-dropzone' + (sobre ? ' is-over' : '')}
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSobre(false);
            receberArquivos(e.dataTransfer.files);
          }}
          onClick={() => document.getElementById('giro-input')?.click()}
        >
          <Icon name="adm_upload" size={26} style={{ margin: '0 auto 10px' }} />
          arraste aqui a pasta com as fotos do giro
          <p style={{ fontSize: 12, color: 'var(--tinta-3)', marginTop: 6 }}>A ordem é detectada pelo nome do arquivo.</p>
          <input id="giro-input" type="file" accept="image/*" multiple hidden onChange={(e) => receberArquivos(e.target.files)} />
        </div>

        {locais.length > 0 ? (
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <GiroViewer quadros={locais.map((q) => q.url)} />

            <div style={{ display: 'grid', gap: 6 }}>
              {locais.slice(0, 6).map((q) => (
                <div key={q.nome} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--tinta-2)' }}>{q.nome}</span>
                  <span style={{ width: 90, height: 4, background: 'var(--fundo-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <span style={{ display: 'block', width: `${q.progresso}%`, height: '100%', background: 'var(--ok)' }} />
                  </span>
                </div>
              ))}
              {locais.length > 6 ? <span style={{ fontSize: 12, color: 'var(--tinta-3)' }}>e mais {locais.length - 6} quadros…</span> : null}
            </div>

            {avisos.map((a) => (
              <div key={a} className="adm-warn">
                <Icon name="adm_alerta" size={15} />
                <span>{a}</span>
              </div>
            ))}

            <div className="adm-warn" style={{ background: 'rgba(162,169,179,.1)', borderColor: 'var(--linha-2)', color: 'var(--tinta-2)' }}>
              <Icon name="adm_info" size={15} />
              <span>
                A prévia acima roda no seu navegador. Para o giro ficar salvo e aparecer no site, a loja precisa de um lugar para guardar as imagens (ainda não
                ligado) — enquanto isso, cole abaixo o endereço de cada quadro já hospedado.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="adm-input adm-input--sm" style={{ flex: '1 1 260px' }} value={urlNova} onChange={(e) => setUrlNova(e.target.value)} placeholder="https://… endereço do quadro" />
              <button
                type="button"
                className="erk-btn erk-btn--s erk-btn--sm"
                onClick={() =>
                  start(async () => {
                    try {
                      setErro('');
                      await adicionarFoto(productId, urlNova, 'turntable');
                      setUrlNova('');
                      router.refresh();
                    } catch (e) {
                      setErro((e as Error).message);
                    }
                  })
                }
              >
                Adicionar quadro
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------- modelo 3D ---------- */}
      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 4 }}>
          Modelo 3D
        </div>
        <p style={{ fontSize: 12, color: 'var(--tinta-3)', margin: '0 0 14px' }}>
          {modelo3dStatus === 'pending'
            ? 'Um modelo foi gerado a partir das fotos. Compare com o giro real antes de publicar.'
            : modelo3dStatus === 'approved'
              ? 'Modelo aprovado — o site já mostra a peça em 3D.'
              : modelo3dStatus === 'discarded'
                ? 'Modelo descartado. O site mostra só as fotos.'
                : 'Nenhum modelo 3D gerado para esta peça ainda.'}
        </p>

        {modelo3dStatus === 'pending' ? (
          <>
            <div className="adm-grid-2">
              <div>
                <div className="adm-swatch-label">Giro real</div>
                {quadrosSalvos.length > 0 ? <GiroViewer quadros={quadrosSalvos} altura={220} /> : <img src={fotoFallback} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }} />}
              </div>
              <div>
                <div className="adm-swatch-label">3D gerado</div>
                <div style={{ height: 220, borderRadius: 12, background: 'var(--fundo-3)', border: '1px solid var(--linha-2)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 16 }}>
                  <div>
                    <Icon name="adm_cubo" size={30} style={{ margin: '0 auto 8px', color: 'var(--tinta-3)' }} />
                    <p style={{ fontSize: 12.5, color: 'var(--tinta-2)', margin: 0 }}>{modelo3dUrl ? 'Modelo .glb pronto para conferência.' : 'Modelo em processamento pela IA.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="erk-btn erk-btn--p erk-btn--sm"
                onClick={() => start(async () => { await decidirModelo3d(productId, 'approved'); router.refresh(); })}
              >
                Aprovar e publicar
              </button>
              <ConfirmButton
                label="Descartar"
                title="Descartar este modelo 3D?"
                description="O modelo gerado é marcado como descartado e o site continua mostrando só as fotos desta peça. Você pode gerar outro depois."
                confirmLabel="Descartar"
                onConfirm={async () => {
                  await decidirModelo3d(productId, 'discarded');
                  router.refresh();
                }}
              />
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <input className="adm-input adm-input--sm" style={{ flex: '1 1 260px' }} value={url3d} onChange={(e) => setUrl3d(e.target.value)} placeholder="https://… endereço do arquivo .glb" />
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => start(async () => { await definirUrlModelo3d(productId, url3d); router.refresh(); })}>
            Salvar modelo
          </button>
        </div>
      </div>
    </div>
  );
}
