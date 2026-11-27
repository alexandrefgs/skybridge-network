# Deploy do SkyBridge numa VPS

Guia para colocar o SkyBridge no ar numa VPS Ubuntu 24.04 (Hostinger KVM 2) com Docker.

Tudo roda em quatro containers do `docker-compose.yml`:

| Container | O que faz |
|---|---|
| `caddy` | Recebe o tráfego nas portas 80 e 443 e gera o certificado HTTPS (Let's Encrypt) sozinho |
| `app` | O SkyBridge: API .NET servindo também o site Angular |
| `db` | SQL Server 2022 Express |
| `backup` | Backup diário do banco em `/opt/skybridge/backups`, guardando os últimos 7 dias |

Só o Caddy fica exposto na internet. O banco e a aplicação ficam na rede interna do Docker.

---

## 1. Apontar o domínio para a VPS

No painel da Hostinger, em **Domínios → seu domínio → DNS / Nameservers**, deixe estes dois registros:

| Tipo | Nome | Conteúdo | TTL |
|---|---|---|---|
| A | `@` | IP da VPS | 300 |
| CNAME | `www` | `flyskybridge.tech` | 300 |

Apague qualquer outro registro A, AAAA ou CNAME do `@` e do `www` (como o da página "parked" da Hostinger).

A propagação leva de alguns minutos a algumas horas. Para conferir, no PowerShell:

```powershell
nslookup flyskybridge.tech
nslookup www.flyskybridge.tech
```

O endereço que aparecer tem que ser o IP da VPS. **Espere isso funcionar antes do passo 7**, porque o Caddy só consegue o certificado HTTPS quando o domínio já aponta para a VPS.

## 2. Entrar na VPS

No PowerShell do seu PC:

```powershell
ssh root@IP_DA_VPS
```

Na primeira vez ele pergunta se confia no servidor: digite `yes`. Como a chave SSH foi cadastrada na criação da VPS, ele entra sem pedir senha.

Todos os comandos dos próximos passos são digitados **dentro da VPS**, até o passo 9.

## 3. Atualizar o sistema e ligar o firewall

```bash
apt update && apt upgrade -y
```

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

O `ufw status` tem que mostrar `OpenSSH`, `80/tcp` e `443/tcp` como `ALLOW`.

As atualizações de segurança automáticas já vêm ligadas no Ubuntu 24.04. Para confirmar:

```bash
systemctl status unattended-upgrades --no-pager
```

Crie também um swap de 2 GB, uma reserva de memória para o build:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 4. Conferir o Docker

O Docker Manager da Hostinger já instala o Docker. Confira:

```bash
docker --version
docker compose version
```

Se algum dos dois não existir, instale com o script oficial:

```bash
curl -fsSL https://get.docker.com | sh
```

## 5. Baixar o projeto

**Se o repositório for público:**

```bash
git clone https://github.com/alexandrefgs/skybridge-network.git /opt/skybridge
```

**Se o repositório for privado**, crie uma chave só para a VPS ler o repositório:

```bash
ssh-keygen -t ed25519 -C "vps-skybridge" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

No GitHub, abra o repositório → **Settings → Deploy keys → Add deploy key**, cole a chave pública, deixe **Allow write access desmarcado** e salve. Depois, na VPS:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
EOF
git clone git@github.com:alexandrefgs/skybridge-network.git /opt/skybridge
```

Entre na pasta:

```bash
cd /opt/skybridge
```

## 6. Configurar os segredos

```bash
cp .env.example .env
chmod 600 .env
openssl rand -base64 48
```

Copie o valor gerado pelo `openssl` (é a `JWT_KEY`) e abra o arquivo:

```bash
nano .env
```

Preencha:

| Variável | Valor |
|---|---|
| `DOMAIN` | Seu domínio, sem `https://` e sem `www` (`flyskybridge.tech`) |
| `SQL_PASSWORD` | Senha forte do banco: 12+ caracteres com maiúscula, minúscula, número e símbolo |
| `JWT_KEY` | O valor gerado pelo `openssl` |
| `ADMIN_EMAIL` | Seu e-mail de administrador do site |
| `ADMIN_PASSWORD` | Senha do administrador do site |
| `CARTO_API_KEY` | Sua chave da CARTO |

Nas senhas, use só letras, números e os símbolos `! @ # % - _ .`. Evite `$`, `;`, aspas e espaços, porque eles quebram o `.env` ou a connection string.

Salve com `Ctrl+O`, `Enter` e saia com `Ctrl+X`.

O `.env` nunca vai para o GitHub (está no `.gitignore`). Guarde uma cópia dessas senhas no seu gerenciador de senhas.

Crie a pasta dos backups com a permissão do usuário do SQL Server:

```bash
mkdir -p backups
chown 10001:0 backups
```

## 7. Subir o SkyBridge

```bash
docker compose up -d --build
```

A primeira vez demora alguns minutos, porque ele compila o Angular e o .NET dentro da VPS. Acompanhe a subida da aplicação:

```bash
docker compose logs -f app
```

Na primeira subida, a API aplica as migrations e importa os aeroportos, pistas, companhias e rotas (um ou dois minutos). Quando aparecer `Now listening on: http://[::]:8080`, aperte `Ctrl+C` para sair dos logs (a aplicação continua rodando).

Confira os quatro containers:

```bash
docker compose ps
```

Todos têm que estar `running` (o `db` aparece como `healthy`).

## 8. Testar

Abra `https://flyskybridge.tech` no navegador.

- O cadeado do HTTPS tem que aparecer.
- `https://www.flyskybridge.tech` tem que redirecionar para o endereço sem `www`.
- Faça login com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do `.env`.
- Recarregue uma página interna (F5 em `/operations`, por exemplo): ela tem que abrir normalmente.
- `https://flyskybridge.tech/health` tem que responder `Healthy`.

Se o HTTPS não funcionar, veja os logs do Caddy:

```bash
docker compose logs caddy
```

O erro mais comum é o domínio ainda não apontar para a VPS (volte ao passo 1).

## 9. Desligar o login por senha no SSH

Faça isso **só depois de confirmar** que você entra na VPS pela chave SSH sem digitar senha. Na VPS:

```bash
cat > /etc/ssh/sshd_config.d/01-skybridge.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
sshd -t
systemctl restart ssh
sshd -T | grep -iE "passwordauthentication|kbdinteractive|permitrootlogin"
```

O nome começa com `01-` de propósito: o SSH usa o primeiro valor que encontra, e a Hostinger cria um `50-cloud-init.conf` que liga a senha. O último comando tem que mostrar `passwordauthentication no`.

**Sem fechar a janela atual**, abra outro PowerShell no seu PC e teste:

```powershell
ssh root@IP_DA_VPS
```

Se entrar, está tudo certo. Se não entrar, use a janela que ficou aberta para apagar o arquivo (`rm /etc/ssh/sshd_config.d/99-skybridge.conf`) e reiniciar o SSH (`systemctl restart ssh`).

Se um dia perder a chave do PC, dá para entrar pelo **terminal do navegador** no painel da Hostinger.

---

## Deploy automático

A cada push na `main`, o GitHub Actions roda os testes, monta a imagem e, se tudo passar, entra na VPS e atualiza o site sozinho. No fim, ele espera o `/health` responder `Healthy`.

A VPS aceita o GitHub com uma chave SSH própria, que **só consegue rodar o script de deploy**: ela não abre terminal, não faz túnel e não executa nenhum outro comando.

### Configuração (uma vez só)

**1. Instale o script de deploy** (na VPS):

```bash
install -m 755 /opt/skybridge/deploy/skybridge-deploy.sh /usr/local/bin/skybridge-deploy
```

Se um dia o `deploy/skybridge-deploy.sh` mudar no repositório, rode esse comando de novo.

**2. Crie a chave do GitHub e libere só o deploy** (na VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /root/.ssh/github_actions -N ""
echo "command=\"/usr/local/bin/skybridge-deploy\",restrict $(cat /root/.ssh/github_actions.pub)" >> /root/.ssh/authorized_keys
```

**3. Cadastre os segredos no GitHub**, em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor | Como pegar (na VPS) |
|---|---|---|
| `DEPLOY_HOST` | IP da VPS | o IP do painel da Hostinger |
| `DEPLOY_KNOWN_HOSTS` | Impressão digital da VPS | `echo "IP_DA_VPS $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"` |
| `DEPLOY_SSH_KEY` | Chave privada do GitHub | `cat /root/.ssh/github_actions` (do `-----BEGIN` ao `-----END`, inclusive) |

**4. Apague a chave privada da VPS** depois de cadastrar o segredo. Ela só precisa existir no GitHub:

```bash
shred -u /root/.ssh/github_actions
```

### Atualizar na mão

Se precisar atualizar sem passar pelo GitHub (por exemplo, com o Actions fora do ar), na VPS:

```bash
skybridge-deploy
```

As migrations novas são aplicadas sozinhas na subida. O banco, as chaves e os certificados ficam em volumes do Docker e não se perdem.

## Backups

O container `backup` faz um backup completo do banco **uma vez por dia** em `/opt/skybridge/backups` e apaga os arquivos com mais de 7 dias.

Para ver os backups:

```bash
ls -lh /opt/skybridge/backups
```

Para fazer um backup na hora, por exemplo antes de uma atualização grande:

```bash
cd /opt/skybridge
docker compose restart backup
```

Para baixar os backups para o seu PC (no PowerShell do PC):

```powershell
scp root@IP_DA_VPS:/opt/skybridge/backups/*.bak .
```

Guarde de vez em quando uma cópia fora da VPS: se o servidor inteiro tiver um problema, o backup que está nele vai junto.

### Restaurar um backup

```bash
cd /opt/skybridge
docker compose stop app backup
docker compose exec db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SENHA_DO_SQL" -C \
  -Q "ALTER DATABASE [SkyBridge] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [SkyBridge] FROM DISK = N'/var/opt/mssql/backup/NOME_DO_ARQUIVO.bak' WITH REPLACE; ALTER DATABASE [SkyBridge] SET MULTI_USER;"
docker compose start app backup
```

Troque `SENHA_DO_SQL` pela `SQL_PASSWORD` do `.env` e `NOME_DO_ARQUIVO` pelo backup escolhido.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `docker compose ps` | Mostra os containers e o estado de cada um |
| `docker compose logs -f app` | Acompanha os logs da aplicação |
| `docker compose restart app` | Reinicia só a aplicação |
| `docker compose down` | Para tudo (os dados continuam nos volumes) |
| `docker compose up -d` | Sobe tudo de novo |
| `docker system prune -f` | Apaga imagens antigas que sobraram das atualizações |
| `df -h` | Mostra o espaço em disco |
| `free -h` | Mostra a memória |

**Nunca rode `docker compose down -v`** na VPS: o `-v` apaga os volumes, inclusive o banco de dados.