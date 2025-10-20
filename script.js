document.addEventListener('DOMContentLoaded', () => {
    const criminalFileTextarea = document.getElementById('criminal-file');
    const reportOutputTextarea = document.getElementById('report-output');
    const solicitanteNameInput = document.getElementById('solicitante-name');
    const solicitanteRgInput = document.getElementById('solicitante-rg');
    const solicitantePhoneInput = document.getElementById('solicitante-phone');
    const totalValueInput = document.getElementById('total-value');
    const generateReportBtn = document.getElementById('generate-report');
    const copyTextBtn = document.getElementById('copy-text');
    const deleteFilesBtn = document.getElementById('delete-files');
    const fileButtonsContainer = document.querySelector('.file-buttons');
    const addFileBtn = document.getElementById('add-file');
    
    let filesData = [];
    let mainFileContent = '';
    const COST_PER_ARTICLE = 200000;

    // Função para reindexar as fichas (garante numeração 1ª, 2ª, etc.)
    function reindexFiles() {
        filesData.forEach((file, index) => {
            file.id = index + 1;
        });
        showFileButtons();
    }

    // Lógica para mostrar os botões de ficha e deletar
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

    // Função dedicada para gerar o relatório e calcular o valor total
    function generateReport() {
        if (filesData.length === 0) {
            totalValueInput.value = '0,00'; 
            reportOutputTextarea.value = '';
            return;
        }

        let totalArticles = 0;
        let fileReports = [];

        // 1. Processa todas as fichas e calcula o total de artigos
        filesData.forEach(file => {
            const report = extractData(file.content);
            totalArticles += report.articlesCount;
            
            // Adiciona o novo formato de artigo, usando a propriedade formattedArticles
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

        // 2. Calcula o valor total e formata APENAS O NÚMERO
        const rawTotalValue = totalArticles * COST_PER_ARTICLE;
        
        const totalValueForReport = rawTotalValue.toLocaleString('pt-BR', {
            style: 'decimal', 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // 3. Atualiza o campo de input na interface
        totalValueInput.value = totalValueForReport;
        
        // 4. Constrói o template, substituindo "R$:" por "VALOR TOTAL:"
        const reportTemplate = `
 ━━━━━━━━✧ • ✧━━━━━━━━ 
    ⚖️ LIMPEZA DE FICHA ⚖️
 ━━━━━━━━✧ • ✧━━━━━━━━ 

SOLICITANTE: ${solicitanteNameInput.value} 
RG: ${solicitanteRgInput.value} 
TELEFONE: ${solicitantePhoneInput.value} 
VALOR TOTAL: R$${totalValueForReport}

`;

        const finalReport = reportTemplate + fileReports.join('\n');
        reportOutputTextarea.value = finalReport;
    }
    
    // Chama a função dedicada ao clicar no botão
    generateReportBtn.addEventListener('click', () => {
        if (filesData.length === 0) {
            alert("Adicione pelo menos uma ficha para gerar o relatório.");
            return;
        }
        generateReport();
    });

    // Extração e Formatação de Dados
    function extractData(text) {
        const lines = text.split('\n');
        let official = '';
        let totalTime = '';
        let totalFine = '';
        let date = '';
        let articlesCount = 0;
        // Novo array para armazenar as linhas formatadas de cada artigo
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
                if (parts.length > 1) {
                    date = parts[0].trim() + ' ' + parts[1].trim();
                } else {
                    date = datePart;
                }
            } 
            // CHAVE DA ALTERAÇÃO: Se a linha for um Artigo, salva ela inteira e conta.
            else if (line.includes('Art.')) {
                // A linha do artigo já está no formato desejado: Art. 143 - Desobediencia (tempo, multa)
                formattedArticlesList.push(line.trim());
                // Conta o artigo para o cálculo do valor total
                articlesCount++;
            }
        });

        return {
            official: official,
            totalTime: totalTime,
            totalFine: totalFine,
            // Retorna a lista de artigos formatada, separada por quebras de linha
            formattedArticles: formattedArticlesList.join('\n'), 
            date: date,
            articlesCount: articlesCount
        };
    }

    // Formatação de Telefone
    solicitantePhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        if (value.length > 3) {
            e.target.value = value.slice(0, 3) + '-' + value.slice(3);
        } else {
            e.target.value = value;
        }
    });

    copyTextBtn.addEventListener('click', () => {
        reportOutputTextarea.select();
        document.execCommand('copy');
        alert("Relatório copiado para a área de transferência!");
    });

    // Deleta todos os dados
    deleteFilesBtn.addEventListener('click', () => {
        criminalFileTextarea.value = '';
        reportOutputTextarea.value = '';
        solicitanteNameInput.value = '';
        solicitanteRgInput.value = '';
        solicitantePhoneInput.value = '';
        totalValueInput.value = '0,00'; 
        filesData = [];
        fileButtonsContainer.innerHTML = '';
        alert("Todos os dados foram deletados.");
    });

});
