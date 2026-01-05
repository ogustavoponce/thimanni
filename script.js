// --- 1. CONFIGURAÇÃO FIREBASE (MANTENHA A SUA REAL AQUI!) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKRf-fSGJvYO8aZlQfxNbBMdWUXLZP9dA",
    authDomain: "thimanni-bbd0d.firebaseapp.com",
    projectId: "thimanni-bbd0d",
    storageBucket: "thimanni-bbd0d.firebasestorage.app",
    messagingSenderId: "782988538430",
    appId: "1:782988538430:web:f0721cf0832d44b6cb576f",
    measurementId: "G-H87S5SBHW5"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. VARIÁVEIS DO USUÁRIO ---
let userData = {
    sexo: '',
    idade: 0,
    peso: 0,
    altura: 0,
    meta: '',
    nivel: '',
    local: '',
    dias: '',
    lesao: '',
    foco: ''
};

// --- 3. NAVEGAÇÃO E QUIZ ---
function nextStep(stepId) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    // Mostra a desejada
    const next = document.getElementById(stepId);
    if(next){
        next.classList.remove('hidden');
        next.classList.add('active');
    }
}

// Opção Simples
function selectOption(category, value, nextStepId) {
    userData[category] = value;
    
    if (nextStepId === 'step-loading') {
        startLoadingProcess(); // Vai para o cálculo
    } else {
        nextStep(nextStepId);
    }
}

// Validação Biometria
function validateBio(nextStepId) {
    const i = document.getElementById('input-idade').value;
    const p = document.getElementById('input-peso').value;
    const a = document.getElementById('input-altura').value;

    if (!i || !p || !a) {
        alert("Precisamos desses dados para calcular seu protocolo.");
        return;
    }

    userData.idade = i;
    userData.peso = p;
    userData.altura = a;
    nextStep(nextStepId);
}

// --- 4. LOADING E CÁLCULO FAKE (Show) ---
function startLoadingProcess() {
    nextStep('step-loading');
    
    const title = document.getElementById('loading-txt');
    const sub = document.getElementById('loading-sub');
    
    const steps = [
        { t: "Calculando IMC...", s: "Processando peso e altura..." },
        { t: "Analisando Metabolismo...", s: `Baseado em ${userData.idade} anos...` },
        { t: "Verificando Lesões...", s: userData.lesao === 'Nenhuma' ? "Apto para carga máxima..." : "Adaptando segurança..." },
        { t: "Finalizando Plano...", s: "Gerando diagnóstico..." }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            title.innerText = steps[i].t;
            sub.innerText = steps[i].s;
            i++;
        } else {
            clearInterval(interval);
            // AQUI MUDOU: Em vez de mostrar o resultado, manda CADASTRAR
            nextStep('step-lead-capture');
        }
    }, 1500);
}

// --- 5. SISTEMA DE CADASTRO (LEAD) ---
// Escuta o submit do formulário de cadastro novo
const leadForm = document.getElementById('lead-form');
if(leadForm) {
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const passConf = document.getElementById('reg-pass-conf').value;
        const btn = e.target.querySelector('button');

        // Validação Senha
        if(pass !== passConf) {
            alert("As senhas não coincidem!");
            return;
        }
        if(pass.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        btn.innerText = "CRIANDO PERFIL...";
        btn.disabled = true;

        // Cria usuário no Firebase Auth
        auth.createUserWithEmailAndPassword(email, pass)
            .then((cred) => {
                // Salva TODOS os dados do Quiz + Contato no Firestore
                return db.collection('usuarios').doc(cred.user.uid).set({
                    nome: name,
                    telefone: phone,
                    email: email,
                    quizData: userData, // Salva as respostas do quiz
                    nomeTreino: "Aguardando Pagamento", // Status inicial
                    status: "lead", // Lead capturado
                    dataCadastro: new Date()
                });
            })
            .then(() => {
                // Sucesso! Mostra o Resultado
                alert("Perfil criado com sucesso!");
                showResults(name); // Passa o nome para personalizar a venda
            })
            .catch((error) => {
                console.error(error);
                let msg = "Erro ao cadastrar.";
                if(error.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado. Faça login.";
                alert(msg);
                btn.innerText = "VER MEU DIAGNÓSTICO";
                btn.disabled = false;
            });
    });
}

// --- 6. EXIBIÇÃO DO RESULTADO (IMC REAL) ---
function showResults(userName) {
    // 1. CÁLCULO REAL DO IMC
    let alturaMetros = userData.altura / 100;
    let imc = (userData.peso / (alturaMetros * alturaMetros)).toFixed(1);

    // 2. Preenche os números
    const elImc = document.getElementById('res-imc');
    const elIdade = document.getElementById('res-idade');
    if(elImc) elImc.innerText = imc;
    if(elIdade) elIdade.innerText = userData.idade + " anos";

    // 3. LÓGICA MÉDICA ADAPTATIVA
    let diagnosticoTexto = "";
    
    // Personaliza com o nome se tiver
    let prefixo = userName ? `${userName}, ` : "";

    if (imc < 18.5) {
        diagnosticoTexto = `"${prefixo}seu IMC de ${imc} indica metabolismo acelerado. Para ganhar volume real, seu treino precisa de menos repetições e mais carga (tensão mecânica), focando em ${userData.foco}."`;
    } else if (imc >= 18.5 && imc < 25) {
        diagnosticoTexto = `"${prefixo}seu IMC de ${imc} está equilibrado. O segredo agora é a Recomposição Corporal: trocar gordura antiga por fibra muscular densa, dando ênfase total em ${userData.foco}."`;
    } else if (imc >= 25 && imc < 30) {
        diagnosticoTexto = `"${prefixo}com IMC de ${imc}, precisamos ativar o efeito EPOC. O plano será híbrido: força + alta intensidade metabólica para secar e definir ${userData.foco}."`;
    } else {
        diagnosticoTexto = `"${prefixo}atenção ao IMC de ${imc}. Sua prioridade absoluta é proteger as articulações enquanto aceleramos a queima de gordura visceral. O protocolo será ajustado para sua segurança."`;
    }

    // Preenche os textos dinâmicos
    const diagBox = document.querySelector('.diagnosis p');
    if(diagBox) diagBox.innerText = diagnosticoTexto;
    
    // Atualiza os spans de resumo
    const txtIdade = document.getElementById('txt-idade');
    const txtDias = document.getElementById('txt-dias');
    const txtFoco = document.getElementById('txt-foco');
    
    if(txtIdade) txtIdade.innerText = userData.idade;
    if(txtDias) txtDias.innerText = userData.dias ? userData.dias.split(' ')[0] : "4";
    if(txtFoco) txtFoco.innerText = userData.foco;

    // Finalmente, mostra a venda
    nextStep('step-sales');
}

function goToPayment() {
    // Como o usuário JÁ está logado (acabou de criar conta), 
    // você pode mandar o UID dele no link do checkout se a plataforma suportar (Webhook)
    // Ou apenas mandar para o checkout simples.
    alert("Redirecionando para Pagamento Seguro...");
    // window.location.href = "SEU_LINK_CHECKOUT";
}

// --- 7. SISTEMA DE LOGIN (MODAL) ---
// Usado apenas para quem JÁ tem conta e clicou em "Entrar" no menu
let isLoginMode = true;

function toggleModal(modalId) { 
    document.getElementById(modalId).classList.toggle('hidden'); 
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const btn = document.getElementById('auth-btn');
    const link = document.getElementById('toggle-link');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('toggle-text');
    
    if (isLoginMode) {
        title.innerText = "Acesso Thimanni";
        btn.innerText = "ENTRAR";
        text.innerText = "Ainda não é aluno?";
        link.innerText = "Criar conta";
    } else {
        title.innerText = "Criar Nova Conta";
        btn.innerText = "CADASTRAR";
        text.innerText = "Já tem conta?";
        link.innerText = "Fazer Login";
    }
}

const authForm = document.getElementById('auth-form');
if(authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const btn = document.getElementById('auth-btn');
        
        btn.innerText = "...";

        if (isLoginMode) {
            // LOGIN NORMAL
            auth.signInWithEmailAndPassword(email, password).then(() => {
                toggleModal('login-modal');
                btn.innerText = "ENTRAR";
            }).catch(err => { 
                alert("Erro ao entrar: " + err.message); 
                btn.innerText = "ENTRAR"; 
            });
        } else {
            // CADASTRO PELO MODAL (Fluxo alternativo)
            auth.createUserWithEmailAndPassword(email, password).then((cred) => {
                return db.collection('usuarios').doc(cred.user.uid).set({
                    nome: "Aluno Novo",
                    email: email,
                    nomeTreino: "Aguardando Pagamento",
                    status: "novo"
                });
            }).then(() => {
                toggleModal('login-modal');
                alert("Conta criada!");
                btn.innerText = "CADASTRAR";
            }).catch(err => { 
                alert(err.message); 
                btn.innerText = "CADASTRAR"; 
            });
        }
    });
}

function logout() { 
    auth.signOut().then(() => {
        nextStep('step-home');
        // Limpa dados locais se quiser
    }); 
}

// --- 8. GERENCIADOR DE ESTADO (AUTH) ---
// Verifica se o usuário está logado ao carregar a página
auth.onAuthStateChanged((user) => {
    const navBtn = document.querySelector('.btn-login-nav');
    
    if (user) {
        // --- USUÁRIO LOGADO ---
        console.log("Logado:", user.email);
        
        // Carrega nome do usuário para o Dashboard
        db.collection('usuarios').doc(user.uid).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                const nomeDisplay = data.nome ? data.nome.split(' ')[0] : "Aluno";
                const elUserName = document.getElementById('user-name');
                if(elUserName) elUserName.innerText = nomeDisplay;
                
                // Carrega dados do treino
                loadUserPlanData(data);
            }
        });

        // Muda botão do menu
        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-dashboard-line"></i> Painel do Aluno';
            navBtn.onclick = () => nextStep('step-dashboard');
        }
        
        // Se o usuário acabou de logar e não está no fluxo de compra, 
        // você pode decidir se manda pro Dashboard.
        // Se ele acabou de se cadastrar no fluxo (step-lead-capture), 
        // ele vai cair aqui também, mas a função registerUser já lidou com a tela de venda.
        
    } else {
        // --- DESLOGADO ---
        if(navBtn) {
            navBtn.innerHTML = '<i class="ri-user-line"></i> Área do Aluno';
            navBtn.onclick = () => toggleModal('login-modal');
        }
        
        // Proteção: Se estiver no dashboard, chuta pra home
        const dash = document.getElementById('step-dashboard');
        if(dash && dash.classList.contains('active')) {
            nextStep('step-home');
        }
    }
});

function loadUserPlanData(data) {
    const elPlan = document.getElementById('user-plan-name');
    const btnDown = document.getElementById('btn-download-pdf');
    
    if(elPlan) elPlan.innerText = data.nomeTreino || "Processando...";
    
    if(btnDown && data.linkPdf) {
        btnDown.href = data.linkPdf;
        btnDown.classList.remove('disabled');
        btnDown.innerHTML = '<i class="ri-download-cloud-line"></i> BAIXAR TREINO COMPLETO';
    }
}