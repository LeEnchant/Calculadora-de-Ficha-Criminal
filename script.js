document.addEventListener('DOMContentLoaded', () => {
    const criminalFileTextarea = document.getElementById('criminal-file');
    const reportOutputTextarea = document.getElementById('report-output');
    const solicitanteNameInput = document.getElementById('solicitante-name');
    const solicitanteRgInput = document.getElementById('solicitante-rg');
    const solicitantePhoneInput = document.getElementById('solicitante-phone');
    const feesInput = document.getElementById('fees');
    const depositInput = document.getElementById('deposit');
    const totalValueInput = document.getElementById('total-value');
    const generateReportBtn = document.getElementById('generate-report');
    const copyTextBtn = document.getElementById('copy-text');
    const deleteFilesBtn = document.getElementById('delete-files');
    const fileButtonsContainer = document.querySelector('.file-buttons');
    const addFileBtn = document.getElementById('add-file');
    
    let filesData = [];
    let mainFileContent = '';
    const COST_PER_ARTICLE = 200000;
    const DEPOSIT_PER_ARTICLE = 44000;

    // Reindexa as fichas
    function reindexFiles() {
        filesData.forEach((file, index) => {
            file.id = index + 1;
        });
        showFileButtons();
    }

    // Mostra botões de fichas
    function showFileButtons() {
        fileButtonsContainer.innerHTML = '';
        filesData.forEach(file => {
            const fileButtonWrapper = document.createElement('div');
            fileButtonWrapper.className = 'file-button-wrapper';
            
            const fileBtn = document.createElement('button');
            fileBtn.className = 'file-btn';
            fileBtn.innerText = `${file.id}ª Ficha`;
            fileBtn.addEventListener('click', () => {
                mainFileContent = criminalFileTextarea.value;
                criminalFileTextarea.value = file.content;
                showBackButton();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-file-btn';
            deleteBtn.innerText = 'X';
            deleteBtn.addEventListener('click', () => {
                filesData = filesData.filter(f => f.id !== file.id);
                criminalFileTextarea.value = '';
                reindexFiles(); 
                generateReport();
            });

            fileButtonWrapper.appendChild(fileBtn);
            fileButtonWrapper.appendChild(deleteBtn);
            fileButtonsContainer.appendChild(fileButtonWrapper);
        });
    }

    function showBackButton() {
        fileButtonsContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerText = 'Voltar';
        backBtn.addEventListener('click', () => {
            criminalFileTextarea.value = mainFileContent;
            showFileButtons();
        });
        fileButtonsContainer.appendChild(backBtn);
    }

    addFileBtn.addEventListener('click', () => {
        const textToSave = criminalFileTextarea.value.trim();
        if (textToSave === "") {
            alert("Por favor, cole um texto na ficha criminal antes de adicionar.");
            return;
        }

        filesData.push({ id: 0, content: textToSave }); 
        criminalFileTextarea.value = '';
        reindexFiles();
    });

    // Gera relatório e cálculos
    function generateReport() {
        if (filesData.length === 0) {
            feesInput.value = 'R$0,00';
            depositInput.value = 'R$0,00';
            totalValueInput.value = 'R$0,00'; 
            reportOutputTextarea.value = '';
            return;
        }

        let totalArticles = 0;
        let fileReports = [];

        // Conta os artigos
        filesData.forEach(file => {
            const report = extractData(file.content);
            totalArticles += report.articlesCount;
            fileReports.push(`
 ━━━━━━━━✧ • ✧━━━━━━━
Oficial: ${report.official} 
Tempo: ${report.totalTime}
Multa: ${report.totalFine}
Artigos: 
${report.formattedArticles}
Data: ${report.date}
`);
        });

        // --- CÁLCULOS PRINCIPAIS ---
        const rawTotalValue = totalArticles * COST_PER_ARTICLE; // Total
        const rawDepositValue = totalArticles * DEPOSIT_PER_ARTICLE; // Depósito
        const rawFeesValue = rawTotalValue - rawDepositValue; // Honorários

        // Formatação de moeda
        const formatCurrency = (value) => value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        });

        // Atualiza campos
        feesInput.value = formatCurrency(rawFeesValue);
        depositInput.value = formatCurrency(rawDepositValue);
        totalValueInput.value = formatCurrency(rawTotalValue);

        // Template do relatório
        const reportTemplate = `
 ━━━━━━━━✧ • ✧━━━━━━━━ 
    ⚖️ LIMPEZA DE FICHA ⚖️
 ━━━━━━━━✧ • ✧━━━━━━━━ 

SOLICITANTE: ${solicitanteNameInput.value} 
RG: ${solicitanteRgInput.value} 
TELEFONE: ${solicitantePhoneInput.value} 

VALOR TOTAL: ${formatCurrency(rawTotalValue)}

`;

        const finalReport = reportTemplate + fileReports.join('\n');
        reportOutputTextarea.value = finalReport;
    }

    generateReportBtn.addEventListener('click', () => {
        if (filesData.length === 0) {
            alert("Adicione pelo menos uma ficha para gerar o relatório.");
            return;
        }
        generateReport();
    });

    // Extração dos dados
    function extractData(text) {
        const lines = text.split('\n');
        let official = '';
        let totalTime = '';
        let totalFine = '';
        let date = '';
        let articlesCount = 0;
        let formattedArticlesList = [];
        
        lines.forEach(line => {
            if (line.includes('QRA Oficial:')) {
                official = line.split('QRA Oficial: ')[1]?.trim() || '';
            } else if (line.includes('Pena Final:')) {
                totalTime = line.split('Pena Final: ')[1]?.trim() || '';
            } else if (line.includes('Pena:')) {
                totalTime = line.split('Pena: ')[1]?.trim() || '';
            } else if (line.includes('Multa: R$')) {
                totalFine = line.split('Multa: ')[1]?.trim() || '';
            } else if (line.includes('Sistema de Calculadora Penal -')) {
                const datePart = line.split(' - ')[1]?.trim() || '';
                const parts = datePart.split(',');
                date = parts.length > 1 ? parts[0].trim() + ' ' + parts[1].trim() : datePart;
            } else if (line.includes('Art.')) {
                formattedArticlesList.push(line.trim());
                articlesCount++;
            }
        });

        return {
            official,
            totalTime,
            totalFine,
            formattedArticles: formattedArticlesList.join('\n'),
            date,
            articlesCount
        };
    }

    // Máscara de telefone
    solicitantePhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value.length > 3 ? value.slice(0, 3) + '-' + value.slice(3) : value;
    });

    // Copiar texto
    copyTextBtn.addEventListener('click', () => {
        reportOutputTextarea.select();
        document.execCommand('copy');
        alert("Relatório copiado para a área de transferência!");
    });

    // Deletar tudo
    deleteFilesBtn.addEventListener('click', () => {
        criminalFileTextarea.value = '';
        reportOutputTextarea.value = '';
        solicitanteNameInput.value = '';
        solicitanteRgInput.value = '';
        solicitantePhoneInput.value = '';
        feesInput.value = 'R$0,00';
        depositInput.value = 'R$0,00';
        totalValueInput.value = 'R$0,00'; 
        filesData = [];
        fileButtonsContainer.innerHTML = '';
        alert("Todos os dados foram deletados.");
    });
});


