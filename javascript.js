const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =========================================================
// TEMA CLARO / ESCURO
// =========================================================
(function () {
    const botao = document.getElementById('botaoTema');
    let temaSalvo = null;
    try { temaSalvo = localStorage.getItem('tema'); } catch (e) {}
    if (!botao) return;

    if (temaSalvo === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    botao.addEventListener('click', function () {
        const temaAtual = document.documentElement.getAttribute('data-theme');
        if (temaAtual === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('tema', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('tema', 'light');
        }
    });
})();

// =========================================================
// ABA ATIVA CONFORME A SEÇÃO VISÍVEL
// =========================================================
(function () {
    const abas = Array.from(document.querySelectorAll('.aba'));
    const nav = document.querySelector('.abas');
    const secoes = ['inicio', 'sobre', 'projetos', 'case', 'contato']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    if (secoes.length === 0) return;

    let atual = null, aguardando = false;

    function definir(id) {
        if (id === atual) return;
        atual = id;
        abas.forEach(function (aba) {
            const ativa = aba.dataset.aba === id;
            aba.classList.toggle('aba-ativa', ativa);
            if (ativa) aba.setAttribute('aria-current', 'true'); else aba.removeAttribute('aria-current');
            if (ativa && nav && nav.scrollWidth > nav.clientWidth) {
                const x = nav.scrollLeft + aba.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - aba.offsetWidth) / 2;
                nav.scrollTo({ left: x, behavior: reduzirMovimento ? 'auto' : 'smooth' });
            }
        });
    }

    function calcular() {
        aguardando = false;
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            return definir(secoes[secoes.length - 1].id); // fim da página → Contato
        }
        let escolhida = secoes[0];
        secoes.forEach(function (s) {
            if (s.getBoundingClientRect().top <= window.innerHeight * 0.35) escolhida = s;
        });
        definir(escolhida.id);
    }

    function pedir() { if (!aguardando) { aguardando = true; requestAnimationFrame(calcular); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    calcular();
})();

// =========================================================
// FOTO: inclina com o mouse e some aos poucos ao rolar
// =========================================================
(function () {
    const hero = document.getElementById('inicio');
    const lateral = document.getElementById('fotoScroll');
    const tilt = document.getElementById('fotoTilt');
    if (!hero || !lateral || !tilt) return;

    // rolagem
    let aguardando = false;
    function atualizar() {
        const p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.7), 0), 1);
        lateral.style.setProperty('--p', p.toFixed(3));
        aguardando = false;
    }
    window.addEventListener('scroll', function () {
        if (!aguardando) { aguardando = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    atualizar();

    // inclinação (só com mouse e sem "reduzir movimento")
    const temMouse = window.matchMedia('(hover: hover)').matches;
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!temMouse || reduzido) return;

    hero.addEventListener('pointermove', function (e) {
        const h = hero.getBoundingClientRect();
        const f = lateral.getBoundingClientRect();
        const x = (e.clientX - h.left) / h.width;
        const y = (e.clientY - h.top) / h.height;
        tilt.style.setProperty('--ry', ((x - 0.5) * 18).toFixed(2));
        tilt.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2));
        tilt.style.setProperty('--mx', Math.min(Math.max((e.clientX - f.left) / f.width, 0), 1) * 100 + '%');
        tilt.style.setProperty('--my', Math.min(Math.max((e.clientY - f.top) / f.height, 0), 1) * 100 + '%');
    });
    hero.addEventListener('pointerleave', function () {
        tilt.style.setProperty('--rx', 0);
        tilt.style.setProperty('--ry', 0);
    });
})();

// =========================================================
// PROGRESSO DE LEITURA + CABEÇALHO COMPACTO
// =========================================================
(function () {
    const barra = document.getElementById('progressoLeitura');
    const cabecalho = document.querySelector('header');
    let aguardando = false;

    function atualizar() {
        aguardando = false;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (barra) barra.style.transform = 'scaleX(' + (total > 0 ? Math.min(window.scrollY / total, 1) : 0).toFixed(4) + ')';
        if (cabecalho) cabecalho.classList.toggle('cabecalho-rolado', window.scrollY > 40);
    }
    window.addEventListener('scroll', function () {
        if (!aguardando) { aguardando = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    atualizar();
})();

// =========================================================
// REVELAÇÃO AO ROLAR (.revelar / .revelar-grupo)
// =========================================================
(function () {
    document.querySelectorAll('.revelar-grupo').forEach(function (grupo) {
        Array.from(grupo.children).forEach(function (filho, i) {
            filho.classList.add('revelar');
            filho.style.setProperty('--atraso', (i * 90) + 'ms');
        });
    });

    const itens = document.querySelectorAll('.revelar');
    if (reduzirMovimento || !('IntersectionObserver' in window)) {
        itens.forEach(function (el) { el.classList.remove('revelar'); });
        return;
    }

    const obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            const el = e.target;
            obs.unobserve(el);
            el.classList.add('visivel');
            const atraso = parseInt(el.style.getPropertyValue('--atraso'), 10) || 0;
            // depois da animação, devolve o elemento ao CSS normal (hover etc.)
            setTimeout(function () {
                el.classList.remove('revelar', 'visivel');
                el.style.removeProperty('--atraso');
            }, 1000 + atraso);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    itens.forEach(function (el) { obs.observe(el); });
})();

// =========================================================
// BRILHO NOS CARTÕES SEGUINDO O CURSOR
// =========================================================
(function () {
    if (!window.matchMedia('(hover: hover)').matches || reduzirMovimento) return;
    document.querySelectorAll('.cartao').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--gx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--gy', (e.clientY - r.top) + 'px');
        });
    });
})();

// =========================================================
// TEXTO DIGITADO / REVELADO: Início → Sobre Mim
// data-efeito="digitar" | "palavras"   data-grupo="sobre"   data-velocidade="ms"
// =========================================================
(function () {
    const espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    function preparar(el) {
        const texto = el.textContent.trim().replace(/\s+/g, ' ');
        const digitar = el.dataset.efeito === 'digitar';
        const unidades = [];

        const leitor = document.createElement('span');   // leitores de tela leem o texto inteiro
        leitor.className = 'sr-only';
        leitor.textContent = texto;

        const raiz = document.createElement('span');     // um único filho (não quebra o flex do cargo)
        raiz.className = 'efeito-texto';
        raiz.setAttribute('aria-hidden', 'true');

        texto.split(' ').forEach(function (palavra, i, todas) {
            const p = document.createElement('span');
            p.className = 'palavra';
            if (digitar) {
                Array.from(palavra).forEach(function (c) {
                    const l = document.createElement('span');
                    l.className = 'letra';
                    l.textContent = c;
                    p.appendChild(l);
                    unidades.push(l);
                });
            } else {
                p.classList.add('letra');
                p.textContent = palavra;
                unidades.push(p);
            }
            raiz.appendChild(p);
            if (i < todas.length - 1) raiz.appendChild(document.createTextNode(' '));
        });

        el.textContent = '';
        el.append(leitor, raiz);
        el.classList.add('preparado');
        return { el: el, raiz: raiz, unidades: unidades };
    }

    const grupos = {};
    document.querySelectorAll('[data-efeito]').forEach(function (el) {
        const nome = el.dataset.grupo || 'hero';
        (grupos[nome] = grupos[nome] || []).push(preparar(el));
    });

    if (reduzirMovimento) {
        document.querySelectorAll('.letra').forEach(function (u) { u.classList.add('on'); });
        return;
    }

    async function rodar(itens) {
        if (!itens || itens.length === 0) return;
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');

        for (const item of itens) {
            const digitando = item.el.dataset.efeito === 'digitar';
            const vel = parseInt(item.el.dataset.velocidade, 10) || 40;

            if (digitando) {
                cursor.classList.remove('fim');
                item.raiz.insertBefore(cursor, item.raiz.firstChild);
            } else {
                cursor.classList.add('fim');
            }

            for (const u of item.unidades) {
                u.classList.add('on');
                if (digitando) u.after(cursor);
                const c = u.textContent.slice(-1);
                await espera(vel + (digitando ? (c === '|' || c === ',' ? 140 : c === '.' ? 260 : 0) : 0));
            }
            await espera(parseInt(item.el.dataset.pausa, 10) || 250);
        }
        cursor.classList.add('fim');
        setTimeout(function () { cursor.remove(); }, 1200);
    }

    const fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const fimHero = fontes.then(function () { return espera(300); }).then(function () { return rodar(grupos.hero); });

    // "Sobre Mim" começa quando o início terminou E o título já está na tela
    const titulo = grupos.sobre && grupos.sobre[0].el;
    const tituloVisivel = new Promise(function (resolve) {
        if (!titulo || !('IntersectionObserver' in window)) return resolve();
        const o = new IntersectionObserver(function (e) {
            if (e.some(function (x) { return x.isIntersecting; })) { o.disconnect(); resolve(); }
        }, { threshold: 0.6, rootMargin: '0px 0px -15% 0px' });
        o.observe(titulo);
    });

    tituloVisivel.then(function () { rodar(grupos.sobre); }); // "Sobre Mim": título fixo, o texto abaixo é escrito quando aparece
})();

// =========================================================
// ANIMAÇÕES POR SEÇÃO (formação, experiência, certificações, projetos)
// =========================================================
(function () {
    if (reduzirMovimento || !('IntersectionObserver' in window)) return;

    const espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const temMouse = window.matchMedia('(hover: hover)').matches;

    function aoAparecer(el, opcoes, fn) {
        const o = new IntersectionObserver(function (es) {
            if (es.some(function (e) { return e.isIntersecting; })) { o.disconnect(); fn(); }
        }, opcoes);
        o.observe(el);
    }

    // ---------- FORMAÇÃO: cartão abre como página, anos "correm" de início a fim ----------
    document.querySelectorAll('.item-formacao').forEach(function (card, i) {
        const pilula = card.querySelector('.formacao-periodo');
        const m = pilula && pilula.textContent.match(/(\d{4})\D+(\d{4})/);
        if (m) {
            const original = pilula.textContent.trim();
            const vis = document.createElement('span');
            vis.setAttribute('aria-hidden', 'true');
            vis.textContent = m[1] + '–' + m[1];
            const sr = document.createElement('span');
            sr.className = 'sr-only';
            sr.textContent = original;
            pilula.textContent = '';
            pilula.append(sr, vis);
            card._anos = { vis: vis, ini: +m[1], fim: +m[2] };
        }
        card.classList.add('f-oculto');

        aoAparecer(card, { threshold: 0.3 }, async function () {
            await espera(i * 250);
            card.classList.remove('f-oculto');
            card.classList.add('f-anim');
            setTimeout(function () { card.classList.remove('f-anim'); }, 2800); // devolve o hover ao normal
            if (card._anos) {
                await espera(1000);
                const a = card._anos;
                for (let ano = a.ini; ano <= a.fim; ano++) {
                    a.vis.textContent = a.ini + '–' + ano;
                    await espera(280);
                }
            }
        });

        if (temMouse) {
            card.addEventListener('pointermove', function (e) {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5) * -16);
                card.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5) * -16);
            });
            card.addEventListener('pointerleave', function () {
                card.style.setProperty('--px', 0);
                card.style.setProperty('--py', 0);
            });
        }
    });

    // ---------- EXPERIÊNCIA: um item por vez, devagar, como um "ver mais" automático ----------
    (function () {
        const tl = document.querySelector('.timeline');
        if (!tl) return;
        const itens = Array.from(tl.querySelectorAll('.timeline-item'));
        itens.forEach(function (it) { it.classList.add('t-oculto'); });
        tl.classList.add('t-pronto');

        (async function () {
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            for (const it of itens) {
                await new Promise(function (ok) { aoAparecer(it, { threshold: 0.6, rootMargin: '0px 0px -10% 0px' }, ok); });
                tl.style.setProperty('--linha-h', (it.offsetTop + rem * 0.8) + 'px'); // linha desce até o item
                await espera(500);
                it.classList.remove('t-oculto');
                it.classList.add('t-anim');
                await espera(1700);
            }
            tl.style.setProperty('--linha-h', '100%');
        })();
    })();

    // ---------- CERTIFICAÇÕES: surgem espalhadas, em ordem aleatória ----------
    (function () {
        const lista = document.querySelector('.lista-chips');
        if (!lista) return;
        const chips = Array.from(lista.children);
        const r = function (a, b) { return a + Math.random() * (b - a); };
        chips.forEach(function (c) {
            c.classList.add('c-oculto');
            c.style.setProperty('--dx', r(-50, 50).toFixed(0) + 'px');
            c.style.setProperty('--dy', r(24, 64).toFixed(0) + 'px');
            c.style.setProperty('--rot', r(-9, 9).toFixed(1) + 'deg');
            c.style.setProperty('--atraso', r(0, 900).toFixed(0) + 'ms');
        });
        aoAparecer(lista, { threshold: 0.4 }, function () {
            chips.forEach(function (c) { c.classList.remove('c-oculto'); c.classList.add('c-anim'); });
            setTimeout(function () {
                chips.forEach(function (c) {
                    c.classList.remove('c-anim');
                    ['--dx', '--dy', '--rot', '--atraso'].forEach(function (v) { c.style.removeProperty(v); });
                });
            }, 3300);
        });
    })();

    // ---------- PROJETOS E CASE: linhas em sequência, números contam, resultado é sublinhado ----------
    document.querySelectorAll('.cartao').forEach(function (card) {
        const linhas = card.querySelectorAll('.timeline-projeto, .descricao-case, .desafio-projeto, .solucao-projeto, .resultado-projeto');
        linhas.forEach(function (l, i) { l.classList.add('linha-anim'); l.style.setProperty('--i', i); });
        card.classList.add('p-oculto');

        const res = card.querySelector('.resultado-projeto');
        let texto = null;
        if (res) {
            texto = document.createElement('span'); // um único filho (o .resultado-projeto é grid)
            texto.className = 'resultado-texto';
            res.textContent.split(/(\d+%)/).forEach(function (t) {
                if (/^\d+%$/.test(t)) {
                    const c = document.createElement('span');
                    c.className = 'contador';
                    c.dataset.alvo = parseInt(t, 10);
                    c.textContent = t;
                    texto.appendChild(c);
                } else {
                    texto.appendChild(document.createTextNode(t));
                }
            });
            res.textContent = '';
            res.appendChild(texto);
            fontes.then(function () {
                texto.querySelectorAll('.contador').forEach(function (c) {
                    c.style.minWidth = c.offsetWidth + 'px'; // evita o texto "pular" enquanto conta
                    c.textContent = '0%';
                });
            });
        }

        aoAparecer(card, { threshold: 0.25 }, async function () {
            card.classList.remove('p-oculto');
            card.classList.add('p-anim');
            if (!texto) return;
            await espera(300 + (linhas.length - 1) * 350 + 400);
            const contadores = Array.from(texto.querySelectorAll('.contador'));
            await Promise.all(contadores.map(function (c) {
                return new Promise(function (ok) {
                    const alvo = +c.dataset.alvo, ini = performance.now();
                    (function passo(agora) {
                        const t = Math.min((agora - ini) / 1400, 1);
                        c.textContent = Math.round(alvo * (1 - Math.pow(1 - t, 3))) + '%';
                        if (t < 1) requestAnimationFrame(passo); else ok();
                    })(ini);
                });
            }));
            texto.classList.add('sublinhado');
        });
    });
})();
