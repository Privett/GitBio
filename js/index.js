(function(){
    var DEFAULT_USER = 'Privett';

    function resolveUser(){
        // 1) sitename.com/onixlol
        var seg = window.location.pathname.split('/').filter(Boolean)
            .filter(function(s){ return !/\.(html?|css|js)$/i.test(s); });
        if (seg[0] && seg[0].toLowerCase() === 'gitbio') {
            seg.shift(); 
        }
        if (seg.length) return decodeURIComponent(seg[seg.length - 1]);

        // 2) ?u=onixlol
        var params = new URLSearchParams(window.location.search);
        if (params.get('u')) return params.get('u');

        // 3)  ?Privett
        var raw = window.location.search.replace(/^\?/, '');
        if (raw && raw.indexOf('=') === -1) return decodeURIComponent(raw);

        var hashMatch = window.location.hash.match(/^#\/([^\/?#]+)/);
        if (hashMatch) return decodeURIComponent(hashMatch[1]);

        return DEFAULT_USER;
    }

    const GH_USER = resolveUser();
    document.title = GH_USER + ' — GitHub';

    var API = 'https://api.github.com';
    var elBgCode   = document.getElementById('bgCode');
    var elAvatar   = document.getElementById('avatar');
    var elName     = document.getElementById('displayName');
    var elHandle   = document.getElementById('loginHandle');
    var elBio      = document.getElementById('bio');
    var elStats    = document.getElementById('statRow');
    var elFollow   = document.getElementById('followBtn');
    var elGhLink   = document.getElementById('ghLink');
    var elBrand    = document.getElementById('brandLabel');
    var elGrid     = document.getElementById('repoGrid');
    var elCount    = document.getElementById('repoCount');

    var viewProfile = document.getElementById('viewProfile');
    var viewDetail  = document.getElementById('viewDetail');
    var backBtn     = document.getElementById('backBtn');
    var detailName  = document.getElementById('detailName');
    var detailLang  = document.getElementById('detailLang');
    var detailDesc  = document.getElementById('detailDesc');
    var detailMeta  = document.getElementById('detailMeta');
    var detailLink  = document.getElementById('detailLink');
    var detailZip   = document.getElementById('detailZip');
    var detailFileDl = document.getElementById('detailFileDl');
    var detailReadme = document.getElementById('detailReadme');
    var detailLoading = document.getElementById('detailLoading');

    var LANG_COLORS = {
        JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5', HTML:'#e34c26',
        CSS:'#563d7c', Java:'#b07219', Go:'#00ADD8', Rust:'#dea584', C:'#555555',
        'C++':'#f34b7d', 'C#':'#178600', PHP:'#4F5D95', Ruby:'#701516', Shell:'#89e051',
        Vue:'#41b883', Swift:'#F05138', Kotlin:'#A97BFF'
    };
    var CODE_EXT = /\.(js|ts|jsx|tsx|py|java|go|rs|c|cpp|h|hpp|cs|php|rb|sh|css|html|json|kt|swift|m)$/i;
    var PLACEHOLDER_CODE =
        'def scan_giveaways():\n    """fallback code — failed to fetch real code from GitHub"""\n    sources = ["steamgifts", "epicgames", "gog"]\n    for s in sources:\n        check(s)\n\nclass Watcher:\n    def __init__(self, interval=30):\n        self.interval = interval\n        self.seen = set()\n\n    def run(self):\n        while True:\n            self.poll()\n            sleep(self.interval)\n';

    function repeatToFill(text, minLen){
        if (!text) text = PLACEHOLDER_CODE;
        var out = text;
        var guard = 0;
        while (out.length < minLen && guard < 40){ out += '\n\n' + text; guard++; }
        return out.slice(0, Math.max(minLen, 4000));
    }

    function setBgCode(text){
        elBgCode.textContent = repeatToFill(text, 9000);
    }

    function applyTintFromImage(imgEl){
        try{
        var c = document.createElement('canvas');
        var w = c.width = 32, h = c.height = 32;
        var ctx = c.getContext('2d');
        ctx.drawImage(imgEl, 0, 0, w, h);
        var data = ctx.getImageData(0, 0, w, h).data;
        var r=0,g=0,b=0,n=0;
        for (var i=0; i<data.length; i+=4){
            var alpha = data[i+3];
            if (alpha < 100) continue;
            r += data[i]; g += data[i+1]; b += data[i+2]; n++;
        }
        if (!n) return;
        r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);

        var hsl = rgbToHsl(r,g,b);
        hsl[1] = Math.max(hsl[1], 0.5);
        hsl[2] = Math.min(Math.max(hsl[2], 0.42), 0.62);
        var boosted = hslToRgb(hsl[0], hsl[1], hsl[2]);

        var root = document.documentElement.style;
        root.setProperty('--tint', r+','+g+','+b);
        root.setProperty('--tint-strong', boosted[0]+','+boosted[1]+','+boosted[2]);
        }catch(e){}
    }
    function rgbToHsl(r,g,b){
        r/=255; g/=255; b/=255;
        var max=Math.max(r,g,b), min=Math.min(r,g,b), h,s,l=(max+min)/2;
        if (max===min){ h=s=0; }
        else{
        var d=max-min;
        s = l>0.5 ? d/(2-max-min) : d/(max+min);
        switch(max){
            case r: h=(g-b)/d+(g<b?6:0); break;
            case g: h=(b-r)/d+2; break;
            default: h=(r-g)/d+4;
        }
        h/=6;
        }
        return [h,s,l];
    }
    function hslToRgb(h,s,l){
        var r,g,b;
        if (s===0){ r=g=b=l; }
        else{
        var hue2rgb = function(p,q,t){
            if (t<0) t+=1; if (t>1) t-=1;
            if (t<1/6) return p+(q-p)*6*t;
            if (t<1/2) return q;
            if (t<2/3) return p+(q-p)*(2/3-t)*6;
            return p;
        };
        var q = l<0.5 ? l*(1+s) : l+s-l*s;
        var p = 2*l-q;
        r = hue2rgb(p,q,h+1/3);
        g = hue2rgb(p,q,h);
        b = hue2rgb(p,q,h-1/3);
        }
        return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
    }

    function fetchRepoCode(owner, repo){
        var url = API + '/repos/' + owner + '/' + repo + '/contents/';
        return fetch(url).then(function(r){ return r.ok ? r.json() : []; })
        .then(function(list){
            if (!Array.isArray(list)) return null;
            var files = list.filter(function(f){ return f.type === 'file' && CODE_EXT.test(f.name); });
            files.sort(function(a,b){ return (b.size||0) - (a.size||0); });
            var pick = files[0];
            if (!pick || !pick.download_url) return null;
            return fetch(pick.download_url).then(function(r){ return r.ok ? r.text() : null; })
            .then(function(text){
                if (!text) return null;
                return {name: pick.name, url: pick.download_url, text: text};
            });
        })
        .catch(function(){ return null; });
    }

    function fetchReadme(owner, repo){
        return fetch(API + '/repos/' + owner + '/' + repo + '/readme')
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(meta){
            if (!meta || !meta.download_url) return null;
            return fetch(meta.download_url).then(function(r){ return r.ok ? r.text() : null; });
        })
        .catch(function(){ return null; });
    }

    function forceDownload(url, filename){
        fetch(url).then(function(r){ return r.blob(); }).then(function(blob){
        var objUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = objUrl; a.download = filename || 'file';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(objUrl); }, 4000);
        }).catch(function(){ window.open(url, '_blank'); });
    }

    function renderRepoCard(repo){
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'repo-card';
        card.setAttribute('aria-label', 'Open repository ' + repo.name);

        var thumb = document.createElement('div');
        thumb.className = 'repo-thumb';
        var img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = '';
        img.src = 'https://opengraph.githubassets.com/1/' + repo.full_name;
        img.onload = function(){ img.classList.add('loaded'); };
        img.onerror = function(){
        img.style.display = 'none';
        thumb.style.background = 'linear-gradient(135deg, rgba(var(--tint-strong),.28), #0c0d12)';
        var fallbackLabel = document.createElement('div');
        fallbackLabel.className = 'repo-thumb-fallback';
        fallbackLabel.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4 2 12l6 8M16 4l6 8-6 8"/></svg>';
        var nameSpan = document.createElement('span');
        nameSpan.textContent = repo.name;
        fallbackLabel.appendChild(nameSpan);
        thumb.appendChild(fallbackLabel);
        };
        thumb.appendChild(img);

        var body = document.createElement('div');
        body.className = 'repo-body';

        var name = document.createElement('div');
        name.className = 'repo-name';
        name.textContent = repo.name;

        var desc = document.createElement('p');
        desc.className = 'repo-desc';
        desc.textContent = repo.description || 'No description.';

        var meta = document.createElement('div');
        meta.className = 'repo-meta';
        var lang = repo.language;
        var langColor = LANG_COLORS[lang] || '#8890b5';
        meta.innerHTML =
        (lang ? '<span><span class="lang-dot" style="background:'+langColor+'"></span>'+lang+'</span>' : '<span>—</span>') +
        '<span>★ ' + (repo.stargazers_count||0) + '</span>' +
        '<span>⑂ ' + (repo.forks_count||0) + '</span>';

        body.appendChild(name); body.appendChild(desc); body.appendChild(meta);
        card.appendChild(thumb); card.appendChild(body);

        card.addEventListener('click', function(){ openDetail(repo); });
        return card;
    }

    function openDetail(repo){
        location.hash = 'repo/' + repo.name;
        viewProfile.style.display = 'none';
        viewDetail.hidden = false;
        viewDetail.querySelector('.detail-card').scrollTop = 0;
        document.body.style.overflow = 'hidden';

        detailName.textContent = repo.name;
        detailLang.textContent = repo.language || '—';
        detailDesc.textContent = repo.description || 'No description.';
        detailMeta.innerHTML =
        '<span>★ ' + (repo.stargazers_count||0) + '</span>' +
        '<span>⑂ ' + (repo.forks_count||0) + '</span>' +
        '<span>updated ' + new Date(repo.updated_at).toLocaleDateString('en-US') + '</span>';
        detailLink.href = repo.html_url;
        detailZip.href = repo.html_url + '/archive/refs/heads/' + (repo.default_branch || 'main') + '.zip';
        detailFileDl.hidden = true;
        detailFileDl.onclick = null;
        detailReadme.innerHTML = '<p class="detail-loading">Loading README…</p>';

        setBgCode(PLACEHOLDER_CODE);

        fetchRepoCode(repo.owner.login, repo.name).then(function(file){
            if (!file) return;
                setBgCode(file.text);
                detailFileDl.hidden = false;
                detailFileDl.textContent = '⭳ Download ' + file.name;
                detailFileDl.onclick = function(){ forceDownload(file.url, file.name); };
            });

            fetchReadme(repo.owner.login, repo.name).then(function(md){
            if (!md){
                detailReadme.innerHTML = '<p class="detail-loading">No README in repository.</p>';
                return;
            }
            try{
                detailReadme.innerHTML = window.marked ? marked.parse(md) : '<pre>' + md.replace(/[&<>]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}) + '</pre>';
            }catch(e){
                detailReadme.textContent = md;
            }
        });
    }

    function closeDetail(){
        history.pushState('', document.title, location.pathname + location.search);
        viewDetail.hidden = true;
        viewProfile.style.display = '';
        document.body.style.overflow = '';
        setBgCode(window.__homeCode || PLACEHOLDER_CODE);
    }
    backBtn.addEventListener('click', closeDetail);
    window.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !viewDetail.hidden) closeDetail(); });
    window.addEventListener('popstate', function(){ if (location.hash.indexOf('#repo/') !== 0) closeDetail(); });

    fetch(API + '/users/' + GH_USER)
        .then(function(r){ if(!r.ok) throw new Error('rate-limit'); return r.json(); })
        .then(function(u){
        elName.textContent = u.name || u.login;
        elHandle.textContent = '@' + u.login;
        elBio.textContent = u.bio || '';
        elBio.style.display = u.bio ? '' : 'none';
        elBrand.textContent = u.login;
        elGhLink.href = u.html_url;
        elFollow.href = u.html_url;
        elStats.innerHTML =
            '<span><b>' + u.public_repos + '</b> repositories</span>' +
            '<span><b>' + u.followers + '</b> followers</span>' +
            '<span><b>' + u.following + '</b> following</span>';
        document.title = (u.name || u.login) + ' — GitHub';

        elAvatar.crossOrigin = 'anonymous';
        elAvatar.onload = function(){ applyTintFromImage(elAvatar); };
        elAvatar.src = u.avatar_url + '&s=128';
        })
        .catch(function(){
        elName.textContent = GH_USER;
        elHandle.textContent = '@' + GH_USER;
        elBio.textContent = 'Failed to load GitHub profile (possibly rate limited). Try refreshing the page a bit later.';
        });

    elGrid.innerHTML = '<div class="repo-card skeleton skeleton-card"></div><div class="repo-card skeleton skeleton-card"></div><div class="repo-card skeleton skeleton-card"></div><div class="repo-card skeleton skeleton-card"></div>';

    fetch(API + '/users/' + GH_USER + '/repos?sort=updated&per_page=100')
        .then(function(r){ if(!r.ok) throw new Error('rate-limit'); return r.json(); })
        .then(function(repos){
        repos = repos.filter(function(r){
            return !r.fork && r.name.toLowerCase() !== GH_USER.toLowerCase();
        });
        elCount.textContent = repos.length + (repos.length===1 ? ' repository' : ' repositories');
        elGrid.innerHTML = '';
        if (!repos.length){
            var e = document.createElement('div');
            e.className = 'empty-msg';
            e.textContent = 'No public repositories yet.';
            elGrid.appendChild(e);
            return;
        }
        repos.forEach(function(repo){ elGrid.appendChild(renderRepoCard(repo)); });

        var top = repos.slice().sort(function(a,b){ return (b.stargazers_count||0)-(a.stargazers_count||0); })[0];
        fetchRepoCode(top.owner.login, top.name).then(function(file){
            window.__homeCode = (file && file.text) || PLACEHOLDER_CODE;
            if (viewDetail.hidden) setBgCode(window.__homeCode);
        });
        })
        .catch(function(){
        elGrid.innerHTML = '<div class="empty-msg">Failed to load repositories (probably GitHub API rate limit). Refresh the page in a few minutes.</div>';
        setBgCode(PLACEHOLDER_CODE);
        });

    setBgCode(PLACEHOLDER_CODE);

    function tryOpenFromHash(){
        var m = location.hash.match(/^#repo\/(.+)$/);
        if (!m) return;
        fetch(API + '/repos/' + GH_USER + '/' + decodeURIComponent(m[1]))
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(repo){ if (repo) openDetail(repo); });
    }
    window.addEventListener('load', tryOpenFromHash);
    }
)();
