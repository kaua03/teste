// login.js
async function realizarLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const btn = document.getElementById('btn-login');

    if(!email || !senha) { alert('Preencha e-mail e senha.'); return; }
    
    btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i>';
    btn.disabled = true;

    try {
        const { data, error } = await window.banco.from('usuarios').select('*').eq('email', email).eq('senha', senha).single();
        
        if (error || !data) {
            alert('E-mail ou senha incorretos.');
        } else {
            // Salva o usuário no navegador
            localStorage.setItem('usuarioLogado', JSON.stringify(data));
            window.location.reload(); // Recarrega a página para o Roteador esconder a tela de login
        }
    } catch(e) {
        alert('Falha na comunicação com o banco.');
    } finally {
        btn.innerHTML = 'ENTRAR <i class="ph-bold ph-sign-in text-lg"></i>';
        btn.disabled = false;
    }
}

function fazerLogout() {
    if(confirm("Deseja realmente sair do sistema?")) {
        localStorage.removeItem('usuarioLogado');
        window.location.reload();
    }
}
