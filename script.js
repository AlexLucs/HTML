let transicaoAlarme = 0;
let contadorAlerta = 0;
let contadorSom = 0;
let lastPriceBRL;
let wakeLock;
const tempoVerificarInatividade = 1000;
let loadingTime = 100;
let tempoInatividade = 0;
let varSetaMostrar;
let ativo = true;
let falhas = 0;
let novoIntervalo = 0;
const maxFalhas = 10;
// Definir tempo para atualizar iniciar em milisegundos
const update_Time = 3000;
// Definir tempo para atualizar taxas em milisegundos
const update_Taxas = 50000;
// Definir tempo máximo de inatividade em segundos(1000s=~17m)
const tempoLimite = 1000;
// Função para resetar o tempo de inatividade

function resetarInatividade() {
	tempoInatividade = 0;
	if (ativo) return;
	document.getElementById('overlay').style.display = 'none';
	ativo = true;
	inicial();
	atualiza_taxas();
	clearInterval(intervaloID);
	intervaloID = setInterval(inicial, update_Time);
	clearInterval(taxaIntervaloID);
	taxaIntervaloID = setInterval(atualiza_taxas, update_Taxas);
}

// Desligar os alarmes por 10s (na variável tempoTransicao)
function fazerTransicaoAlarme(tempoTransicao = 15000) {
	transicaoAlarme = 1;
	if (typeof trasicaoAlarmeID !== 'undefined') {
		clearTimeout(trasicaoAlarmeID);
	}
	trasicaoAlarmeID = setTimeout(() => {
		transicaoAlarme = 0;
	}, tempoTransicao);
}

function verificarInatividade() {
	// Se já está inativo não faça nada
	if (!ativo) return;
	// Adiciona tempo de inatividade
	tempoInatividade++;
	if (tempoInatividade >= tempoLimite) {
		document.getElementById('overlay').style.display = 'flex';
		ativo = false;
		clearTimeout(alarmesID);
		clearInterval(intervaloID);
		clearInterval(taxaIntervaloID);
		wakeLock.release();
	}
}

// Monitorando eventos de teclado
document.addEventListener('keydown', resetarInatividade);
// Monitorando eventos de movimento do mouse
document.addEventListener('mousemove', resetarInatividade);

function pyWebviewFechar() {
	window.pywebview.api.fechar();
}

function pyWebviewMinimize() {
	window.pywebview.api.minimizar();
}

function pyWebviewCentralizar() {
	window.pywebview.api.centralizar('True');
}

function pyWebviewFixar() {
	const btn = document.getElementById('fixar-btn');
	if (btn.textContent === '△') {
		btn.setAttribute('title', 'Desafixar');
		btn.setAttribute('alt', 'Desafixar');
		btn.textContent = '▽';
	} else {
		btn.setAttribute('title', 'Fixar');
		btn.setAttribute('alt', 'Fixar');
		btn.textContent = '△';
	}
	window.pywebview.api.fixarTopo();
}

function pyWebviewSalvarAlerta(json) {
	window.pywebview.api.salvar_alerta(json);
}

async function pyWebviewCarregarAlerta() {
	try {
		let alertas = await window.pywebview.api.carregar_alerta();
		return alertas;
	} catch (erro) {
		console.error("Erro ao carregar alertas:", erro); // Loga o erro
		return []; // Retorna um array vazio em caso de erro
	}
}

function reiniciar() {
	if (document.getElementById('fixar-btn').textContent == '▽') {
		document.getElementById('fixar-btn').textContent == '△'
		window.pywebview.api.fixarTopo();
	}
	location.reload();
}

function pararIniciar() {
	if (ativo) {
		ativo = false;
		document.getElementById('overlay').style.display = 'flex';
		clearTimeout(alarmesID);
		clearInterval(intervaloID);
		clearInterval(taxaIntervaloID);
		wakeLock.release();
		document.removeEventListener('keydown', resetarInatividade);
		document.removeEventListener('mousemove', resetarInatividade);
		alternarBtnPausa();
	} else {
		ativo = true;
		document.getElementById('overlay').style.display = 'none';
		inicial();
		clearInterval(intervaloID);
		intervaloID = setInterval(inicial, update_Time);
		atualiza_taxas();
		clearInterval(taxaIntervaloID);
		taxaIntervaloID = setInterval(atualiza_taxas, update_Taxas);
		document.addEventListener('keydown', resetarInatividade);
		document.addEventListener('mousemove', resetarInatividade);
		fazerTransicaoAlarme();
		alternarBtnPausa();
	}
}

function alternarBtnPausa() {
	if (document.getElementById("pausar-btn").getAttribute("title") == "Pausar") {
		document.getElementById("pausar-btn").setAttribute("title", "Reiniciar");
	} else {
		document.getElementById("pausar-btn").setAttribute("title", "Pausar");
	}
}

function botoesPywebview() {
	if (navigator.userAgent == "pywebview") {
		document.getElementById("reload-btn").style.display = "flex";
		document.getElementById("centralizar-btn").style.display = "flex";
		document.getElementById("fixar-btn").style.display = "flex";
		document.getElementById("alerta-btn").style.display = "flex";
		document.getElementById("minimize-btn").style.display = "flex";
		document.getElementById("close-btn").style.display = "flex";
		document.getElementById("pausar-btn").style.display = "flex";
	} else {
		document.getElementById("pausar-btn").style.left = "unset";
		document.getElementById("pausar-btn").style.right = "0px";
		document.getElementById("pausar-btn").style.display = "flex";
		document.getElementById("alerta-btn").style.left = "0px";
		document.getElementById("alerta-btn").style.display = "flex";
	}
}

async function inicial() {
	if (ativo) {
		wakeLock = await navigator.wakeLock.request('screen');
		const percentElement = document.getElementById('info-percent');
		try {
			const responseBRL = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCBRL');
			const dataBRL = await responseBRL.json();
			lastPriceBRL = parseFloat(dataBRL.lastPrice);
			const formattedPriceBRL = lastPriceBRL.toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL'
			});
			const priceChangePercent = parseFloat(dataBRL.priceChangePercent);
			// Calcular se houve aumento ou diminuição do preço e mostrar a seta correspondente
			if (typeof varSetaOld !== 'undefined') {
				let varSetaNew = priceChangePercent;
				if (varSetaOld > varSetaNew) {
					varSetaMostrar = "↓";
				} else if (varSetaOld < varSetaNew) {
					varSetaMostrar = "↑";
				} else {
					varSetaMostrar = varSetaMostrar;
				}
				varSetaOld = priceChangePercent;
			} else {
				varSetaOld = priceChangePercent;
				varSetaMostrar = "↑";
			}
			const formattedPercent = priceChangePercent.toFixed(2) + '% ';

			// Formatar a variavel de hora e data
			const now = new Date();
			const horaFormatado = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
			const dataFormatada = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear().toString().slice(2)}`;
			const formattedTime = dataFormatada + " - " + horaFormatado;

			// Alterar o Título da página com o novo valor
			let titleText = `${formattedPriceBRL} | ${formattedPercent}`;
			document.title = titleText;

			// Atualizar informações de máxima e mínima de preços
			document.getElementById('highPrice').textContent = parseFloat(dataBRL.highPrice).toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL'
			});
			
			document.getElementById('lowPrice').textContent = parseFloat(dataBRL.lowPrice).toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL'
			});
			
			// Atualizar preço em BRL, percentual de aumento e hora da última atualização
			document.getElementById('info-price').textContent = formattedPriceBRL;
			if (ativo) {
				document.getElementById('info-percent').textContent = formattedPercent;
				if (varSetaMostrar == '↑') {
					document.getElementById('info-seta').style.color = "#f7931a";
				} else if (varSetaMostrar == '↓') {
					document.getElementById('info-seta').style.color = "white";
				}
				// Atualiza a seta indicando a última variação depois apaga e reativa a animação
				document.getElementById('info-seta').style.opacity = '0';
				document.getElementById('info-seta').style.animation = 'none';
				document.getElementById('info-seta').offsetHeight;
				document.getElementById('info-seta').style.animation = 'surgindo 1s forwards';
				document.getElementById('info-seta').textContent = varSetaMostrar;
			}
			document.getElementById('info-time').textContent = formattedTime;
			// Atualizar preço em USD (indice BTC) e USD B3
			atualiza_USD(lastPriceBRL);
		} catch (error) {
			console.error('Erro ao buscar dados da API BTC/BRL Binance:', error);
			document.title = 'Sem Dados';
			document.getElementById('info-price').textContent = '▶Sem Dados◀';
		}
		// Intervalo de Inicial
		intervaloVariavelInicial = Math.floor(Math.random() * 3001 + update_Time);
		if (typeof intervaloID !== 'undefined') {
			clearInterval(intervaloID);
		}
		intervaloID = setInterval(inicial, intervaloVariavelInicial);
		// checar alarmes depois de 1 segundo(1000 milisegundos)
		if (typeof alarmesID !== 'undefined') {
			clearTimeout(alarmesID);
		}
		alarmesID = setTimeout(checarAlarmes, 1000);
	}
}

async function atualiza_B3(dollarExchangeRate) {
	try {
		const responseBRLx = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
		const dataBRLx = await responseBRLx.json();
		const lastPriceBRLaskx = parseFloat(dataBRLx.USDBRL.ask);
		const lastPriceBRLbidx = parseFloat(dataBRLx.USDBRL.bid);
		const lastPriceBRLx = (lastPriceBRLaskx + lastPriceBRLbidx) / 2
		const formattedPriceBRLx = lastPriceBRLx.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		});
		document.getElementById('info-dolar').textContent = `${dollarExchangeRate} | ${formattedPriceBRLx}`;
	} catch (error) {
		console.error('Erro ao buscar dados do BRL/USDT AwesomeAPI:', error);
		document.getElementById('info-dolar').textContent = 'Sem Dados';
	}
}

async function atualiza_USD(lastPriceBRL) {
	try {
		const responseUSD = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
		const dataUSD = await responseUSD.json();
		const lastPriceUSD = parseFloat(dataUSD.lastPrice);
		const formattedPriceUSD = lastPriceUSD.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'USD'
		});
		// Atualizar preço em USDT
		document.getElementById('info-usdt').textContent = formattedPriceUSD;
		// Calcula o valor do dólar dividindo o valor do BTC em reais pelo valor em dólares
		const dollarExchangeRate = (lastPriceBRL / lastPriceUSD).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		});
		// Atualizar informações de máxima e mínima de preços
		document.getElementById('highPriceDol').textContent = parseFloat(dataUSD.highPrice).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'USD'
		});
		document.getElementById('lowPriceDol').textContent = parseFloat(dataUSD.lowPrice).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'USD'
		});
		// Atualizar preço em Dólar
		atualiza_B3(dollarExchangeRate)
	} catch (error) {
		console.error('Erro ao buscar dados do BTC/BRL:', error);
		document.getElementById('info-usdt').textContent = 'Sem Dados';
		document.getElementById('info-dolar').textContent = 'Sem Dados';
	}
}

async function atualiza_taxas() {
	if (ativo) {
		try {
			const responseFees = await fetch('https://mempool.space/api/v1/fees/recommended');
			const dataFees = await responseFees.json();
			document.getElementById('fastestFee').textContent = `${dataFees.fastestFee} sat/vB`;
			document.getElementById('halfHourFee').textContent = `${dataFees.halfHourFee} sat/vB`;
			document.getElementById('hourFee').textContent = `${dataFees.hourFee} sat/vB`;
			document.getElementById('economyFee').textContent = `${dataFees.economyFee} sat/vB`;
			document.getElementById('minimumFee').textContent = `${dataFees.minimumFee} sat/vB`;
			document.getElementById('mediumFee').textContent = `${(dataFees.minimumFee + dataFees.economyFee + dataFees.hourFee + dataFees.halfHourFee + dataFees.fastestFee) / 5} sat/vB`;
		} catch (error) {
			console.error('Erro ao buscar dados de taxas:', error);
		}
		intervaloVariavelTaxas = Math.floor(Math.random() * 20001 + update_Taxas);
		if (typeof taxaIntervaloID !== 'undefined') {
			clearInterval(taxaIntervaloID);
		}
		taxaIntervaloID = setInterval(atualiza_taxas, intervaloVariavelTaxas);
	}
}

function checarAlarmes() {
	try {
		alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];
	} catch (e) {
		console.error("Erro ao parsear o JSON:", e);
	}
	if (transicaoAlarme === 0) {
		if (alertas.length > 0) {
			alertas.forEach((alerta, index) => {
				if (alerta.tipo == "maior") {
					if (lastPriceBRL >= alerta.valor) {
						if (contadorAlerta == 0) {
							$.alert({
								title: 'ALERTA',
								content: 'O Preço do Bitcoin superou<br>' + (parseFloat(alerta.valor) || 0).toLocaleString('pt-BR', {
									style: 'currency',
									currency: 'BRL'
								}),
								theme: 'dark',
								onClose: function() {
									contadorSom = 0;
									contadorAlerta = 0;
									mudarTipo(index, desativar = 1);
								},
								draggable: false,
								boxWidth: '300px',
								useBootstrap: false,
							});
						}
						contadorAlerta = 1;
						tocarAlerta();
					}
				} else if (alerta.tipo == "menor") {
					if (lastPriceBRL <= alerta.valor) {
						if (contadorAlerta == 0) {
							$.alert({
								title: 'ALERTA',
								content: 'O Preço do Bitcoin caiu abaixo de<br>' + (parseFloat(alerta.valor) || 0).toLocaleString('pt-BR', {
									style: 'currency',
									currency: 'BRL'
								}),
								theme: 'dark',
								onClose: function() {
									contadorSom = 0;
									contadorAlerta = 0;
									mudarTipo(index, desativar = 1);
								},
								draggable: false,
								boxWidth: '300px',
								useBootstrap: false,
							});
						}
						contadorAlerta = 1;
						tocarAlerta();
					}
				} else if (alerta.tipo == "desativado") {
					fazerTransicaoAlarme();
				} else {
					console.log("Falha de tipo de alarme.");
				}
			});
		}
	}
}

function apagarAlertas(index) {
	let alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];
	alertas.splice(index, 1);
	localStorage.setItem('alertasjson', JSON.stringify(alertas));
	if (navigator.userAgent == "pywebview") {
		pyWebviewSalvarAlerta(alertas);
	}
	carregarAlertas();
}

function carregarAlertas() {
	const tabela = document.getElementById("alertasTabela").getElementsByTagName('tbody')[0];
	tabela.innerHTML = '';
	let alertas = [];
	// Ordenar os alarmes em ordem decrescente se existirem
	try {
		alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];
		alertasOrdenados = [...alertas].sort((a, b) => b.valor - a.valor)
		if (JSON.stringify(alertas) !== JSON.stringify(alertasOrdenados)) {
			localStorage.setItem('alertasjson', JSON.stringify(alertasOrdenados));
			alertas = alertasOrdenados;
		}
	} catch (e) {
		console.error("Erro ao parsear o JSON:", e);
	}
	if (alertas.length > 0) {
		alertas.forEach((valorAlerta, index) => {
			valorAlertaFormatado = parseFloat(valorAlerta.valor).toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL',
				minimumFractionDigits: 2
			});
			
			const novaLinha = tabela.insertRow();

			const celulatipo = novaLinha.insertCell(0);
			const botaotipo = document.createElement("button");
			const tipo = valorAlerta.tipo;
			botaotipo.id = "botaoTipo";
			botaotipo.type = "button";
			botaotipo.onclick = function() {
				mudarTipo(index);
				fazerTransicaoAlarme();
			};
			if (tipo == "maior") {
				botaotipo.textContent = "Maior △";
				botaotipo.title = "Alertar quando valor do BTC for maior que "+valorAlertaFormatado;
				botaotipo.style.opacity = 1;
			} else if (tipo == "menor") {
				botaotipo.textContent = "Menor ▽";
				botaotipo.title = "Alertar quando valor do BTC for menor que "+valorAlertaFormatado;
				botaotipo.style.opacity = 1;
			} else if (tipo == "desativado") {
				botaotipo.textContent = "Desativado";
				botaotipo.title = "Alarme Desativado";
				botaotipo.style.opacity = .5;
			}
			celulatipo.appendChild(botaotipo);

			const celulaValor = novaLinha.insertCell(1);
			celulaValor.textContent = valorAlertaFormatado;
			celulaValor.title = valorAlertaFormatado;
			const celulaAcao = novaLinha.insertCell(2);
			const botaoApagar = document.createElement("button");
			botaoApagar.id = "botaoApagar";
			botaoApagar.textContent = "Apagar";
			botaoApagar.title = "Apagar alarme "+valorAlertaFormatado;
			botaoApagar.onclick = function() {
				apagarAlertas(index);
			};
			celulaAcao.appendChild(botaoApagar);
		});
	}
	
	// Limpa o campo de valor
	document.getElementById('valorAlerta').value = "";
	// Foca no campo para digitar o valor
	document.getElementById('valorAlerta').focus();
	// Adiciona um monitor para impedir a tecla enter de submeter os formularios
	document.getElementById('valorAlerta').addEventListener('keydown', function(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (document.getElementById("modalAlerta").style.display === "block") {
				if (this.value.trim() !== '') {
					criarAlerta();
				}
			}
		}
		if (event.key === 'Escape') {
			if (document.getElementById("modalAlerta").style.display === "block") {
				voltarAlerta();
			}
		}
	});
}

// Mudar tipo
function mudarTipo(index, desativar = 0) {
	let alertas = [];
	try {
		alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];
	} catch (e) {
		console.error("Erro ao parsear o JSON:", e);
	}

	// Verificar se o índice é válido
	if (index < 0 || index >= alertas.length) {
		console.error("Índice inválido");
		return;
	}

	// Salvar valores atuais em variáveis para comparar
	let valor = alertas[index].valor;
	let tipoOriginal = alertas[index].tipo; // Tipo original antes de mudar

	// Inverter o tipo de alarme
	let tipoAlterado;
	if (desativar == 0) {
		if (tipoOriginal === "maior") {
			tipoAlterado = "menor";
		} else if (tipoOriginal === "menor") {
			tipoAlterado = "desativado";
		} else if (tipoOriginal === "desativado") {
			tipoAlterado = "maior";
		} else {
			console.log("Falha no tipo.");
		}
	} else {
		tipoAlterado = "desativado";
	}

	// Atualizar o tipo do alarme
	alertas[index].tipo = tipoAlterado;

	// Checar se já existe um alerta com o mesmo número e novo tipo, excluindo o próprio alarme alterado
	let alertaExistente = alertas.some((alerta, i) => {
		return alerta.valor === valor && alerta.tipo === tipoAlterado && i !== index;
	});

	if (alertaExistente) {
		$.alert({
			title: 'FALHA',
			content: 'Existe um alerta com esse mesmo valor.',
			theme: 'dark',
			draggable: false,
			boxWidth: '300px',
			useBootstrap: false,
			autoClose: 'ok|5000',
		});
	} else {
		try {
			localStorage.setItem('alertasjson', JSON.stringify(alertas));

			// Se estiver no ambiente PyWebView, chamar a função de integração
			if (navigator.userAgent.includes("pywebview")) {
				pyWebviewSalvarAlerta(alertas);
			}
		} catch (e) {
			console.error("Erro ao salvar no localStorage:", e);
		}
	}
	carregarAlertas();
}

// Mostra ou esconder a tela de alertas
function mostrarTelaAlerta() {
	const modal = document.getElementById("modalAlerta");
	const darkback = document.getElementById('darkback');
	if (modal.style.display === "block") {
		modal.style.display = "none";
		darkback.style.display = 'none';
	} else {
		modal.style.display = "block";
		darkback.style.display = 'flex';
	}
	carregarAlertas()
}

async function sincronizaAlertas() {
	let alertasPython = await pyWebviewCarregarAlerta();
	let alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];
	let alertasSalvos = alertasPython || [];
	if (JSON.stringify(alertasSalvos) !== JSON.stringify(alertas)) {
		localStorage.setItem('alertasjson', JSON.stringify(alertasSalvos));
	}
}

// Criar alertas
function criarAlerta() {
	valor = document.getElementById("valorAlerta").value;

	if (validarValor(valor)) {
		salvarAlerta(valor, "maior", 0);
	} else {
		$.alert({
			title: 'FALHA',
			content: 'Digite um número válido.',
			theme: 'dark',
			draggable: false,
			boxWidth: '300px',
			useBootstrap: false,
			autoClose: 'ok|15000',
		});
	}
	carregarAlertas();
}

// Testes de validação se é um número
function validarValor(numero) {
	const paraValidar = parseFloat(numero);
	return !isNaN(paraValidar) && numero.trim() !== "";
}

// Salvar valor dos alertas
function salvarAlerta(valor, tipo, vazio) {
	// Recuperar os alertas armazenados no localStorage
	let alertas = JSON.parse(localStorage.getItem('alertasjson')) || [];

	// Criar o novo alerta como um objeto
	let novoAlerta = {
		valor,
		tipo,
		vazio
	};

	// Checar se já existe um alerta com o mesmo número e tipo
	let alertaExistente = alertas.find(alerta => alerta.valor === valor && alerta.tipo === tipo);

	if (alertaExistente) {
		$.alert({
			title: 'FALHA',
			content: 'Existe um alerta com esse mesmo valor.',
			theme: 'dark',
			draggable: false,
			boxWidth: '300px',
			useBootstrap: false,
			autoClose: 'ok|15000',
		});
	} else {
		alertas.push(novoAlerta); // Adicionar o novo alerta
		localStorage.setItem('alertasjson', JSON.stringify(alertas));
		// Se estiver no ambiente PyWebView, chamar a função de integração
		if (navigator.userAgent == "pywebview") {
			pyWebviewSalvarAlerta(alertas);
		}
		fazerTransicaoAlarme()
	}
}

// Voltar sem criar alerta
function voltarAlerta() {
	limparValor();
	mostrarTelaAlerta();
}

// Limpar campo de alerta
function limparValor() {
	if (document.getElementById('valorAlerta').value != "") {
		document.getElementById('valorAlerta').value = "";
	}
}

function limparMoeda(numero) {
	let valorSemSimbolo = numero.replace('R$', '').trim();
	let valorSemMilhar = valorSemSimbolo.replace('.', '').replace(',', '.');
	let preco = parseFloat(valorSemMilhar);
	return preco;
}

function tocarAlerta(repeticoes = 1, volume = 1) {
	const audio = new Audio('alerta.mp3');
	audio.volume = volume;
	let contador = 0;

	// Definir o preload para carregar o áudio automaticamente
	audio.preload = 'auto';

	// Garantir que o áudio esteja carregado antes de tocar
	audio.addEventListener('canplaythrough', () => {
		const tocar = () => {
			if (contador < repeticoes) {
				audio.play().catch(error => {
					$.alert({
						title: 'FALHA',
						content: 'Falha ao reproduzir áudio.',
						theme: 'dark',
						draggable: false,
						boxWidth: '300px',
						useBootstrap: false,
						autoClose: 'ok|3000',
					});
				});
				contador++;

				// Usar setTimeout para criar um pequeno atraso entre as repetições
				audio.onended = () => {
					setTimeout(tocar, 100); // 100ms de atraso
				};
			}
		};

		// Começar a reprodução
		tocar();
	});

	// Carregar o áudio
	audio.load();
}

function verificarCarregamento() {
	if (document.getElementById('info-dolar').textContent == '' || document.getElementById('info-seta').textContent == '' || document.getElementById('mediumFee').textContent == '') {
		loadingTime *= 1.2;
		if (loadingTime > 2000) {
			location.reload();
		}
		setTimeout(verificarCarregamento, loadingTime);
	} else {
		document.getElementById('tela-carregamento').style.display = 'none';
		document.getElementById('conteudo').style.display = 'block';
		loadingTime = 100;
		// Iniciar a função de sincronia com o Backend Python
		if (navigator.userAgent == "pywebview") {
			sincronizaAlertas();
		}
		// Aplicar um contador
		var wts=document.createElement('script');
		wts.async=true;
		wts.src='https://app.ardalio.com/log7.js';
		document.head.appendChild(wts);
		wts.onload = function(){
			wtslog7(2193605,5); 
		};
		// Pausar alarmes por 5s
		fazerTransicaoAlarme(5000);
	}
}

// Testar se estão disponíveis e enviar notificações // Não usada
function prepararNotificacao(conteudo = "") {
	if ("Notification" in window) {
		if (Notification.permission === "default") {
			Notification.requestPermission().then(function(permission) {
				if (permission === "granted") {
					console.log("Permissão para notificações concedida!");
				} else {
					console.log("Permissão negada para notificações.");
					console.log(Notification.permission)
				}
			});
		} else {
			console.log(Notification.permission)
			new Notification("Aqui está sua notificação!", {
				body: "Você pode personalizar o corpo da notificação.",
				icon: "btc-logo.svg",
			});
		}
	}
}

// Função anônima para executar várias funções no load
window.addEventListener('load', () => {
	botoesPywebview();
	inicial();
	atualiza_taxas();
	// Remove a tela de carregamento depois de carregar certos elementos e mostra o conteúdo
	setTimeout(verificarCarregamento, loadingTime);
	// Monitora o teclado e o mouse por qualquer ação para resetar a inatividade
	document.addEventListener('keydown', resetarInatividade);
	document.addEventListener('mousemove', resetarInatividade);
	// Verificando a inatividade a cada segundo
	setInterval(verificarInatividade, tempoVerificarInatividade);
	// Conferir se as notificações são possíveis, se estão ativas e pedir autorização se não estiverem
	// prepararNotificacao();
});