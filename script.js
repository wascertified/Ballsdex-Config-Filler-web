(function() {
    const root = document.documentElement;
    const key = 'bdx_theme';
    const btn = document.getElementById('themeToggle');

    function apply(mode) {
        if (mode === 'auto') {
            root.setAttribute('data-theme', 'auto');
            const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
            btn.dataset.on = isDark ? 'true' : 'false';
            return;
        }
        root.setAttribute('data-theme', mode); btn.dataset.on = (mode === 'dark');
    }
    function init() {
        const saved = localStorage.getItem(key);
        if (saved) { apply(saved); }
        else { apply('auto'); }
    }
    btn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') || 'auto';
        const next = current === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark') : (current === 'dark' ? 'light' : 'dark');
        apply(next); localStorage.setItem(key, next);
    });
    init();
})();

const form = document.getElementById('configForm');
const out = document.getElementById('yamlOut');
const dlBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const ghBtn = document.getElementById('githubLinkBtn');

const STORE_KEY = 'bdx_config_v1';

function getLines(id) {
    const v = (document.getElementById(id).value || '').trim();
    if (!v) return [];
    return v.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function isNumericField(name) {
    return ['maxFavorites', 'maxAttackBonus', 'maxHealthBonus'].includes(name);
}

function quote(str) {
    if (str === null || str === undefined) return "\"\"";
    return '"' + String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function toYAML(obj) {
    const lines = [];
    const indent = (lvl) => '  '.repeat(lvl);
    const write = (k, v, lvl) => {
        if (Array.isArray(v)) {
            if (v.length === 0) { lines.push(`${indent(lvl)}${k}: []`); return; }
            lines.push(`${indent(lvl)}${k}:`);
            v.forEach(item => lines.push(`${indent(lvl + 1)}- ${quote(item)}`));
        } else if (v && typeof v === 'object') {
            lines.push(`${indent(lvl)}${k}:`);
            Object.entries(v).forEach(([kk, vv]) => write(kk, vv, lvl + 1));
        } else if (typeof v === 'number') {
            lines.push(`${indent(lvl)}${k}: ${v}`);
        } else {
            const val = (v || v === 0) ? quote(v) : '""';
            lines.push(`${indent(lvl)}${k}: ${val}`);
        }
    };
    Object.entries(obj).forEach(([k, v]) => write(k, v, 0));
    return lines.join('\n');
}

function collect() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.guildIds = getLines('guildIds');
    data.rootRoleIds = getLines('rootRoleIds');
    data.adminRoleIds = getLines('adminRoleIds');
    data.caughtMessages = getLines('caughtMessages');
    data.wrongMessages = getLines('wrongMessages');
    data.spawnMessages = getLines('spawnMessages');
    data.slowMessages = getLines('slowMessages');
    data.additionalPackages = getLines('additionalPackages');
    data.logChannel = document.getElementById('logChannel')?.value?.trim() || '';
    data.teamMembersAreOwners = (document.getElementById('teamMembersAreOwners')?.value === 'true');
    data.spawnChanceMin = Number(document.getElementById('spawnChanceMin')?.value) || 40;
    data.spawnChanceMax = Number(document.getElementById('spawnChanceMax')?.value) || 55;
    for (const k of Object.keys(data)) {
        if (isNumericField(k) && data[k] !== '') { data[k] = Number(data[k]); }
    }
    return data;
}

function generateFullYAML(data) {
    let yaml = `# yaml-language-server: $schema=json-config-ref.json\n\n`;

    yaml += `# paste the bot token after regenerating it here\n`;
    yaml += `discord-token: ${data.discordToken || ''}\n\n`;

    yaml += `# prefix for old-style text commands, mostly unused\n`;
    yaml += `text-prefix: ${data.textPrefix || 'b.'}\n\n`;

    yaml += `# define the elements given with the /about command\n`;
    yaml += `about:\n\n`;
    yaml += `  # define the beginning of the description of /about\n`;
    yaml += `  # the other parts is automatically generated\n`;
    yaml += `  description: >\n`;
    yaml += `    ${data.description || 'Collect countryballs on Discord, exchange them and battle with friends!'}\n\n`;
    yaml += `  # override this if you have a fork\n`;
    yaml += `  github-link: ${data.githubLink || 'https://github.com/laggron42/BallsDex-DiscordBot'}\n\n`;
    yaml += `  # valid invite for a Discord server\n`;
    yaml += `  discord-invite: ${data.discordInvite || 'https://discord.gg/INVITE_CODE'}\n\n`;
    yaml += `  terms-of-service: ${data.termsOfService || 'https://gist.github.com/ # replace with your own link'}\n`;
    yaml += `  privacy-policy: ${data.privacyPolicy || 'https://gist.github.com/ # replace with your own link'}\n\n`;

    yaml += `# WORK IN PROGRESS, DOES NOT FULLY WORK\n`;
    yaml += `# override the name "countryball" in the bot\n`;
    yaml += `collectible-name: ${data.collectibleName || 'countryball'}\n\n`;

    yaml += `# WORK IN PROGRESS, DOES NOT FULLY WORK\n`;
    yaml += `# override the name "countryballs" in the bot\n`;
    yaml += `plural-collectible-name: ${data.pluralCollectibleName || 'countryballs'}\n\n`;

    yaml += `# WORK IN PROGRESS, DOES NOT FULLY WORK\n`;
    yaml += `# override the name "BallsDex" in the bot\n`;
    yaml += `bot-name: ${data.botName || 'BallsDex'}\n\n`;

    yaml += `# players group cog command name\n`;
    yaml += `# this is /balls by default, but you can change it for /animals or /rocks for example\n`;
    yaml += `players-group-cog-name: ${data.playersGroupCogName || 'balls'}\n\n`;

    yaml += `# emoji used to represent a favorited collectible\n`;
    yaml += `favorited-collectible-emoji: ${data.favoritedCollectibleEmoji || '❤️'}\n\n`;

    yaml += `# maximum amount of favorites that are allowed\n`;
    yaml += `max-favorites: ${data.maxFavorites || 50}\n\n`;

    yaml += `# the highest/lowest possible attack bonus, do not leave empty\n`;
    yaml += `# this cannot be smaller than 0, enter a positive number\n`;
    yaml += `max-attack-bonus: ${data.maxAttackBonus || 20}\n\n`;

    yaml += `# the highest/lowest possible health bonus, do not leave empty\n`;
    yaml += `# this cannot be smaller than 0, enter a positive number\n`;
    yaml += `max-health-bonus: ${data.maxHealthBonus || 20}\n\n`;

    yaml += `# enables the /admin command\n`;
    yaml += `admin-command:\n\n`;
    yaml += `  # all items here are list of IDs. example on how to write IDs in a list:\n`;
    yaml += `  # guild-ids:\n`;
    yaml += `  #   - 1049118743101452329\n`;
    yaml += `  #   - 1078701108500897923\n\n`;

    yaml += `  # list of guild IDs where /admin should be registered\n`;
    yaml += `  guild-ids:\n`;
    if (data.guildIds && data.guildIds.length > 0) {
        data.guildIds.forEach(id => {
            yaml += `    - ${id}\n`;
        });
    }
    yaml += `\n`;

    yaml += `  # list of role IDs having full access to /admin\n`;
    yaml += `  root-role-ids:\n`;
    if (data.rootRoleIds && data.rootRoleIds.length > 0) {
        data.rootRoleIds.forEach(id => {
            yaml += `    - ${id}\n`;
        });
    }
    yaml += `\n`;

    yaml += `  # list of role IDs having partial access to /admin\n`;
    yaml += `  admin-role-ids:\n`;
    if (data.adminRoleIds && data.adminRoleIds.length > 0) {
        data.adminRoleIds.forEach(id => {
            yaml += `    - ${id}\n`;
        });
    }
    yaml += `\n`;

    yaml += `# log channel for moderation actions\n`;
    yaml += `log-channel: ${data.logChannel || ''}\n\n`;

    yaml += `# manage bot ownership\n`;
    yaml += `owners:\n`;
    yaml += `  # if enabled and the application is under a team, all team members will be considered as owners\n`;
    yaml += `  team-members-are-owners: ${data.teamMembersAreOwners ? 'true' : 'false'}\n`;
    yaml += `\n`;
    yaml += `  # a list of IDs that must be considered owners in addition to the application/team owner\n`;
    yaml += `  co-owners:\n`;
    yaml += `\n`;
    yaml += `\n`;

    yaml += `# Admin panel related settings\n`;
    yaml += `admin-panel:\n\n`;
    yaml += `    # to enable Discord OAuth2 login, fill this\n`;
    yaml += `    # client ID of the Discord application (not the bot's user ID)\n`;
    yaml += `    client-id: ${data.clientId || ''}\n`;
    yaml += `    # client secret of the Discord application (this is not the bot token)\n`;
    yaml += `    client-secret: ${data.clientSecret || ''}\n\n`;

    yaml += `    # to get admin notifications from the admin panel, create a Discord webhook and paste the url\n`;
    yaml += `    webhook-url: ${data.webhookUrl || ''}\n\n`;

    yaml += `    # this will provide some hyperlinks to the admin panel when using /admin commands\n`;
    yaml += `    # set to an empty string to disable those links entirely\n`;
    yaml += `    url: ${data.adminPanelUrl || 'http://localhost:8000'}\n\n`;

    yaml += `# list of packages that will be loaded\n`;
    yaml += `packages:\n`;
    yaml += `  - ballsdex.packages.admin\n`;
    yaml += `  - ballsdex.packages.balls\n`;
    yaml += `  - ballsdex.packages.config\n`;
    yaml += `  - ballsdex.packages.countryballs\n`;
    yaml += `  - ballsdex.packages.info\n`;
    yaml += `  - ballsdex.packages.players\n`;
    yaml += `  - ballsdex.packages.trade\n`;

    // Add additional packages if provided
    if (data.additionalPackages && data.additionalPackages.length > 0) {
        data.additionalPackages.forEach(pkg => {
            if (pkg.trim()) {
                yaml += `  - ballsdex.packages.${pkg.trim()}\n`;
            }
        });
    }

    yaml += `\n`;

    yaml += `# prometheus metrics collection, leave disabled if you don't know what this is\n`;
    yaml += `prometheus:\n`;
    yaml += `  enabled: false\n`;
    yaml += `  host: "0.0.0.0"\n`;
    yaml += `  port: 15260\n\n`;

    yaml += `# spawn chance range\n`;
    yaml += `# with the default spawn manager, this is *approximately* the min/max number of minutes\n`;
    yaml += `# until spawning a countryball, before processing activity\n`;
    yaml += `spawn-chance-range: [${data.spawnChanceMin || 40}, ${data.spawnChanceMax || 55}]\n\n`;

    yaml += `spawn-manager: ballsdex.packages.countryballs.spawn.SpawnManager\n\n`;

    yaml += `# sentry details, leave empty if you don't know what this is\n`;
    yaml += `# https://sentry.io/ for error tracking\n`;
    yaml += `sentry:\n`;
    yaml += `    dsn: ""\n`;
    yaml += `    environment: "production"\n\n`;

    yaml += `catch:\n`;
    yaml += `  # Add any number of messages to each of these categories. The bot will select a random\n`;
    yaml += `  # one each time.\n`;
    yaml += `  # {user} is mention. {collectible} is collectible name. {ball} is ball name, and \n`;
    yaml += `  # {collectibles} is collectible plural.\n\n`;

    yaml += `  # the label shown on the catch button\n`;
    yaml += `  catch_button_label: "${data.catchButtonLabel || 'Catch me!'}"\n\n`;

    yaml += `  # the message that appears when a user catches a ball \n`;
    yaml += `  caught_msgs:\n`;
    if (data.caughtMessages && data.caughtMessages.length > 0) {
        data.caughtMessages.forEach(msg => {
            yaml += `    - "${msg}"\n`;
        });
    } else {
        yaml += `    - "{user} You caught **{ball}**!"\n`;
    }
    yaml += `\n`;

    yaml += `  # the message that appears when a user gets the name wrong\n`;
    yaml += `  # here and only here, you can use {wrong} to show the wrong name that was entered\n`;
    yaml += `  # note that a user can put whatever they want into that field, so be careful\n`;
    yaml += `  wrong_msgs:\n`;
    yaml += `    # - {user} Wrong name! You put: {wrong}\n`;
    if (data.wrongMessages && data.wrongMessages.length > 0) {
        data.wrongMessages.forEach(msg => {
            yaml += `    - "${msg}"\n`;
        });
    } else {
        yaml += `    - "{user} Wrong name!"\n`;
    }
    yaml += `\n`;

    yaml += `  # the message that appears above the spawn art\n`;
    yaml += `  # {user} is not available here, because who would it ping?\n`;
    yaml += `  spawn_msgs:\n`;
    if (data.spawnMessages && data.spawnMessages.length > 0) {
        data.spawnMessages.forEach(msg => {
            yaml += `    - "${msg}"\n`;
        });
    } else {
        yaml += `    - "A wild {collectible} appeared!"\n`;
    }
    yaml += `\n`;

    yaml += `  # the message that appears when a user is to slow to catch a ball\n`;
    yaml += `  slow_msgs:\n`;
    if (data.slowMessages && data.slowMessages.length > 0) {
        data.slowMessages.forEach(msg => {
            yaml += `    - "${msg}"\n`;
        });
    } else {
        yaml += `    - "{user} Sorry, this {collectible} was caught already!"\n`;
    }

    return yaml;
}

const fieldToYamlLine = {
    discordToken: 4,
    textPrefix: 7,
    description: 15,
    githubLink: 18,
    discordInvite: 21,
    termsOfService: 23,
    privacyPolicy: 24,
    collectibleName: 28,
    pluralCollectibleName: 32,
    botName: 36,
    playersGroupCogName: 40,
    favoritedCollectibleEmoji: 43,
    maxFavorites: 46,
    maxAttackBonus: 50,
    maxHealthBonus: 54,
    guildIds: 65,
    rootRoleIds: 68,
    adminRoleIds: 71,
    logChannel: 74,
    clientId: 90,
    clientSecret: 92,
    webhookUrl: 95,
    adminPanelUrl: 99,
    additionalPackages: 102,
    catchButtonLabel: 137,
    caughtMessages: 140,
    wrongMessages: 146,
    spawnMessages: 152,
    slowMessages: 156,
    spawnChanceMin: 120,
    spawnChanceMax: 120
};
let currentHighlight = null;
function highlightYamlLine(line) {
    clearYamlHighlight();
    const el = document.querySelector(`#yamlOut span[data-line='${line}']`);
    if (el) {
        el.classList.add('yaml-highlight');
        currentHighlight = el;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}
function clearYamlHighlight() {
    if (currentHighlight) {
        currentHighlight.classList.remove('yaml-highlight');
        currentHighlight = null;
    }
}
function render() {
    const data = collect();
    const yaml = generateFullYAML(data);
    out.innerHTML = yaml.split('\n').map((line, i) => `<span data-line='${i + 1}'>${line}</span>`).join('\n');
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    const gh = (data.githubLink || '').trim();
    ghBtn.href = gh || '#';
    ghBtn.setAttribute('aria-disabled', gh ? 'false' : 'true');
    dlBtn.disabled = false;

    updateConfigStats(yaml);

    const fields = [
        { name: 'collectibleName', label: 'Collectible Name' },
        { name: 'pluralCollectibleName', label: 'Plural Collectible Name' },
        { name: 'playersGroupCogName', label: 'Players Group Command Name' }
    ];

    fields.forEach(f => {
        const el = document.getElementsByName(f.name)[0];
        if (el) {
            el.classList.remove('input-error');
            const old = el.parentNode.querySelector('.error-msg');
            if (old) old.remove();
        }
    });

    fields.forEach(f => {
        const el = document.getElementsByName(f.name)[0];
        if (el) {
            const val = el.value;
            let msg = '';
            if (/[^a-z0-9_]/.test(val)) msg = (window.i18n?.t('form.errors.only_lower_num_underscore') || 'Only lowercase letters, numbers, and underscores are allowed.');
            if (/[A-Z]/.test(val)) msg = (window.i18n?.t('form.errors.no_caps') || 'No capital letters allowed.');
            if (/\s/.test(val)) msg = (window.i18n?.t('form.errors.no_spaces') || 'No spaces allowed.');
            if (msg) {
                el.classList.add('input-error');
                const div = document.createElement('div');
                div.className = 'error-msg';
                div.textContent = msg;
                el.parentNode.appendChild(div);
            }
        }
    });
}

function updateConfigStats(yaml) {
    const configSizeText = document.getElementById('configSizeText');
    const configLinesText = document.getElementById('configLinesText');

    if (configSizeText && configLinesText) {
        const size = new Blob([yaml]).size;
        const lines = yaml.split('\n').length;

        let sizeText = '';
        if (size < 1024) {
            sizeText = `${size} bytes`;
        } else if (size < 1024 * 1024) {
            sizeText = `${(size / 1024).toFixed(1)} KB`;
        } else {
            sizeText = `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }

        configSizeText.textContent = sizeText;
        configLinesText.textContent = `${lines} lines`;
    }
}

function restore() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([k, v]) => {
            const el = document.getElementById(k);
            if (!el) return;
            if (Array.isArray(v)) el.value = v.join('\n');
            else el.value = v;
        });
        const tmaoHidden = document.getElementById('teamMembersAreOwners');
        const tmaoTrueBtn = document.getElementById('tmaoTrueBtn');
        const tmaoFalseBtn = document.getElementById('tmaoFalseBtn');
        if (tmaoHidden && tmaoTrueBtn && tmaoFalseBtn) {
            const isTrue = String(tmaoHidden.value) === 'true';
            tmaoTrueBtn.classList.toggle('primary', isTrue);
            tmaoFalseBtn.classList.toggle('primary', !isTrue);
        }
    } catch (e) { console.warn('restore failed', e) }
}

form.addEventListener('input', render);

function download() {
    const data = collect();
    const yaml = generateFullYAML(data);
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'config.yml';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

dlBtn.addEventListener('click', download);
document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); download(); } });

resetBtn.addEventListener('click', () => {
    if (!confirm(window.i18n?.t('form.errors.confirm_clear') || 'Clear all fields?')) return;
    form.reset(); localStorage.removeItem(STORE_KEY); render();
});

restore();
render();

document.addEventListener('DOMContentLoaded', function() {
    const validateConfigBtn = document.getElementById('validateConfigBtn');
    const shareConfigBtn = document.getElementById('shareConfigBtn');
    const tmaoHidden = document.getElementById('teamMembersAreOwners');
    const tmaoTrueBtn = document.getElementById('tmaoTrueBtn');
    const tmaoFalseBtn = document.getElementById('tmaoFalseBtn');

    const numFieldIds = [
        'maxFavorites',
        'maxAttackBonus',
        'maxHealthBonus',
        'logChannel',
        'clientId',
        'spawnChanceMin',
        'spawnChanceMax'
    ];
    const multiNumFieldIds = [
        'guildIds',
        'rootRoleIds',
        'adminRoleIds'
    ];

    numFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('inputmode', 'numeric');
            el.setAttribute('pattern', '[0-9]*');
            el.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    });

    multiNumFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('inputmode', 'numeric');
            el.setAttribute('pattern', '[0-9\n]*');
            el.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9\n]/g, '');
            });
        }
    });

    if (validateConfigBtn) {
        validateConfigBtn.addEventListener('click', function() {
            const data = collect();
            const yaml = generateFullYAML(data);

            const validationResult = validateConfiguration(data);

            if (validationResult.isValid) {
                alert(window.i18n?.t('validation.success') || '✅ Configuration is valid!');
            } else {
                alert(`${window.i18n?.t('validation.error_prefix') || '❌ Configuration validation failed:'} ${validationResult.errorMessage}`);
            }
        });
    }

    if (shareConfigBtn) {
        shareConfigBtn.addEventListener('click', function() {
            const data = collect();

            if (data.discordToken && data.discordToken.trim()) {
                alert(`${window.i18n?.t('validation.share_security_warning') || '⚠️ Security Warning'}\n\n${window.i18n?.t('validation.share_token_warning') || 'Cannot share configuration: Discord Bot Token is filled. This contains sensitive information that should not be shared.'}`);
                return;
            }

            if (data.clientSecret && data.clientSecret.trim()) {
                alert(`${window.i18n?.t('validation.share_security_warning') || '⚠️ Security Warning'}\n\n${window.i18n?.t('validation.share_client_secret_warning') || 'Cannot share configuration: Discord Client Secret is filled. This contains sensitive information that should not be shared.'}`);
                return;
            }

            const shareData = {
                textPrefix: data.textPrefix,
                description: data.description,
                githubLink: data.githubLink,
                discordInvite: data.discordInvite,
                spawnChanceMin: data.spawnChanceMin,
                spawnChanceMax: data.spawnChanceMax
            };

            const shareUrl = new URL(window.location.href);
            shareUrl.searchParams.set('share', btoa(JSON.stringify(shareData)));

            navigator.clipboard.writeText(shareUrl.toString()).then(() => {
                alert(window.i18n?.t('validation.share_success') || '🔗 Share link copied to clipboard!');
            }).catch(() => {
                prompt('Share this link:', shareUrl.toString());
            });
        });
    }

    function syncTeamMembersOwnersUI() {
        if (!tmaoHidden || !tmaoTrueBtn || !tmaoFalseBtn) return;
        const isTrue = String(tmaoHidden.value) === 'true';
        tmaoTrueBtn.classList.toggle('primary', isTrue);
        tmaoFalseBtn.classList.toggle('primary', !isTrue);
    }
    if (tmaoHidden && tmaoTrueBtn && tmaoFalseBtn) {
        tmaoTrueBtn.addEventListener('click', function() { tmaoHidden.value = 'true'; syncTeamMembersOwnersUI(); render(); });
        tmaoFalseBtn.addEventListener('click', function() { tmaoHidden.value = 'false'; syncTeamMembersOwnersUI(); render(); });
        syncTeamMembersOwnersUI();
    }

    const uploadBar = document.getElementById('uploadBar');
    const uploadInput = document.getElementById('uploadInput');
    const uploadBtn = document.getElementById('uploadBtn');

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    function mapYamlToFormData(y) {
        const mapped = {};
        mapped.discordToken = y['discord-token'] || '';
        mapped.textPrefix = y['text-prefix'] || '';
        const about = y['about'] || {};
        mapped.description = about['description'] ? String(about['description']).trim() : '';
        mapped.githubLink = about['github-link'] || '';
        mapped.discordInvite = about['discord-invite'] || '';
        mapped.termsOfService = about['terms-of-service'] || '';
        mapped.privacyPolicy = about['privacy-policy'] || '';

        mapped.collectibleName = y['collectible-name'] || '';
        mapped.pluralCollectibleName = y['plural-collectible-name'] || '';
        mapped.botName = y['bot-name'] || '';
        mapped.playersGroupCogName = y['players-group-cog-name'] || '';
        mapped.favoritedCollectibleEmoji = y['favorited-collectible-emoji'] || '';
        mapped.maxFavorites = y['max-favorites'] || '';
        mapped.maxAttackBonus = y['max-attack-bonus'] || '';
        mapped.maxHealthBonus = y['max-health-bonus'] || '';

        const admin = y['admin-command'] || {};
        mapped.guildIds = (admin['guild-ids'] || []).map(String);
        mapped.rootRoleIds = (admin['root-role-ids'] || []).map(String);
        mapped.adminRoleIds = (admin['admin-role-ids'] || []).map(String);

        mapped.logChannel = y['log-channel'] || '';

        const owners = y['owners'] || {};
        mapped.teamMembersAreOwners = owners['team-members-are-owners'] === true;

        const adminPanel = y['admin-panel'] || {};
        mapped.clientId = adminPanel['client-id'] || '';
        mapped.clientSecret = adminPanel['client-secret'] || '';
        mapped.webhookUrl = adminPanel['webhook-url'] || '';
        mapped.adminPanelUrl = adminPanel['url'] || '';

        const spawnRange = y['spawn-chance-range'];
        if (Array.isArray(spawnRange) && spawnRange.length === 2) {
            mapped.spawnChanceMin = Number(spawnRange[0]);
            mapped.spawnChanceMax = Number(spawnRange[1]);
        }

        const catchCfg = y['catch'] || {};
        mapped.catchButtonLabel = catchCfg['catch_button_label'] || '';
        mapped.caughtMessages = catchCfg['caught_msgs'] || [];
        mapped.wrongMessages = catchCfg['wrong_msgs'] || [];
        mapped.spawnMessages = catchCfg['spawn_msgs'] || [];
        mapped.slowMessages = catchCfg['slow_msgs'] || [];

        return mapped;
    }

    function applyToForm(mapped) {
        const entries = Object.entries(mapped);
        for (const [k, v] of entries) {
            const el = document.getElementById(k);
            if (!el) continue;
            if (Array.isArray(v)) el.value = v.join('\n');
            else if (typeof v === 'boolean') el.value = v ? 'true' : 'false';
            else el.value = String(v ?? '');
        }
    }

    function hasUnknownFields(input) {
        const topKnown = new Set(['discord-token', 'text-prefix', 'about', 'collectible-name', 'plural-collectible-name', 'bot-name', 'players-group-cog-name', 'favorited-collectible-emoji', 'max-favorites', 'max-attack-bonus', 'max-health-bonus', 'admin-command', 'log-channel', 'owners', 'admin-panel', 'packages', 'prometheus', 'spawn-chance-range', 'spawn-manager', 'sentry', 'catch']);

        const aboutKnown = new Set(['description', 'github-link', 'discord-invite', 'terms-of-service', 'privacy-policy']);
        const adminKnown = new Set(['guild-ids', 'root-role-ids', 'admin-role-ids']);
        const ownersKnown = new Set(['team-members-are-owners', 'co-owners']);
        const panelKnown = new Set(['client-id', 'client-secret', 'webhook-url', 'url']);
        const prometheusKnown = new Set(['enabled', 'host', 'port']);
        const sentryKnown = new Set(['dsn', 'environment']);
        const catchKnown = new Set(['catch_button_label', 'caught_msgs', 'wrong_msgs', 'spawn_msgs', 'slow_msgs']);

        function unknownKeys(obj, levelKey) {
            if (!obj || typeof obj !== 'object') return [];
            const keys = Object.keys(obj);
            let allow;
            switch (levelKey) {
                case 'about': allow = aboutKnown; break;
                case 'admin-command': allow = adminKnown; break;
                case 'owners': allow = ownersKnown; break;
                case 'admin-panel': allow = panelKnown; break;
                case 'prometheus': allow = prometheusKnown; break;
                case 'sentry': allow = sentryKnown; break;
                case 'catch': allow = catchKnown; break;
                default: allow = topKnown; break;
            }
            const unk = keys.filter(k => !allow.has(k));
            let nested = [];
            for (const k of keys) {
                if (['about', 'admin-command', 'owners', 'admin-panel', 'prometheus', 'sentry', 'catch'].includes(k)) {
                    nested = nested.concat(unknownKeys(obj[k], k));
                }
            }
            return unk.concat(nested);
        }

        const unknown = unknownKeys(input, null);
        return unknown.length > 0 ? unknown : null;
    }

    async function handleFiles(files) {
        if (!files || !files.length) return;
        try {
            const txt = await readFileAsText(files[0]);
            let y;
            try {
                y = jsyaml.load(txt);
            } catch (e) {
                alert(window.i18n?.t('upload.invalid_yaml') || 'The uploaded file is not a valid YAML.');
                return;
            }
            if (!y || typeof y !== 'object') {
                alert(window.i18n?.t('upload.invalid_yaml') || 'The uploaded file is not a valid YAML.');
                return;
            }

            const unknown = hasUnknownFields(y);
            if (unknown) {
                alert((window.i18n?.t('upload.schema_error') || 'The uploaded config contains unknown fields or invalid format.') + `\nUnknown: ${unknown.join(', ')}`);
                return;
            }

            const mapped = mapYamlToFormData(y);
            const validation = validateConfiguration({
                ...collect(),
                ...mapped
            }, { strictRequired: false });
            if (!validation.isValid) {
                alert(`${window.i18n?.t('validation.error_prefix') || '❌ Configuration validation failed:'} ${validation.errorMessage}`);
                return;
            }

            applyToForm(mapped);
            localStorage.setItem(STORE_KEY, JSON.stringify(collect()));
            render();
            alert(window.i18n?.t('upload.accepted') || 'Config loaded successfully.');
        } catch (err) {
            console.error(err);
            alert(window.i18n?.t('upload.invalid_yaml') || 'The uploaded file is not a valid YAML.');
        }
    }

    if (uploadBtn) { uploadBtn.addEventListener('click', () => uploadInput?.click()); }
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }
    if (uploadBar) {
        uploadBar.addEventListener('dragover', (e) => { e.preventDefault(); uploadBar.classList.add('dragover'); });
        uploadBar.addEventListener('dragleave', () => uploadBar.classList.remove('dragover'));
        uploadBar.addEventListener('drop', (e) => { e.preventDefault(); uploadBar.classList.remove('dragover'); const files = e.dataTransfer?.files; handleFiles(files); });
    }
});

function validateConfiguration(data, options) {
    const allowedVariables = ['{user}', '{ball}', '{collectible}', '{collectibles}', '{wrong}'];
    const opts = Object.assign({ strictRequired: true }, options || {});
    const result = { isValid: true, errorMessage: '' };

    if (opts.strictRequired && !data.discordToken) {
        result.isValid = false;
        result.errorMessage = window.i18n?.t('validation.missing_token') || 'Discord Bot Token is required';
        return result;
    }

    if (opts.strictRequired && !data.textPrefix) {
        result.isValid = false;
        result.errorMessage = window.i18n?.t('validation.missing_prefix') || 'Text Command Prefix is required';
        return result;
    }

    if (opts.strictRequired && !data.description) {
        result.isValid = false;
        result.errorMessage = window.i18n?.t('validation.missing_description') || 'Description is required';
        return result;
    }

    const formatRestrictedFields = [
        { name: 'collectibleName', label: 'Collectible Name' },
        { name: 'pluralCollectibleName', label: 'Plural Collectible Name' },
        { name: 'playersGroupCogName', label: 'Players Group Command Name' }
    ];

    for (const field of formatRestrictedFields) {
        const value = data[field.name];
        if (value && value.trim()) {
            if (/[^a-z0-9_]/.test(value)) {
                result.isValid = false;
                result.errorMessage = (window.i18n?.t('validation.invalid_format') || 'Invalid format in {field}: only lowercase letters, numbers, and underscores are allowed').replace('{field}', field.label);
                return result;
            }
            if (/[A-Z]/.test(value)) {
                result.isValid = false;
                result.errorMessage = (window.i18n?.t('validation.no_caps') || 'No capital letters allowed in {field}').replace('{field}', field.label);
                return result;
            }
            if (/\s/.test(value)) {
                result.isValid = false;
                result.errorMessage = (window.i18n?.t('validation.no_spaces') || 'No spaces allowed in {field}').replace('{field}', field.label);
                return result;
            }
        }
    }

    const gameMessageFields = [
        { field: 'caughtMessages', name: 'caught messages' },
        { field: 'wrongMessages', name: 'wrong messages' },
        { field: 'spawnMessages', name: 'spawn messages' },
        { field: 'slowMessages', name: 'slow messages' }
    ];

    for (const messageField of gameMessageFields) {
        const messages = data[messageField.field] || [];

        for (const message of messages) {
            if (!message) continue;

            const usedVariables = message.match(/\{[^}]+\}/g) || [];
            for (const variable of usedVariables) {
                if (!allowedVariables.includes(variable)) {
                    result.isValid = false;
                    result.errorMessage = (window.i18n?.t('validation.unknown_variable') || 'Unknown variable found: {variable}').replace('{variable}', variable);
                    return result;
                }
            }

            if (messageField.field === 'spawnMessages' && message.includes('{user}')) {
                result.isValid = false;
                result.errorMessage = window.i18n?.t('validation.user_in_spawn') || '{user} variable is not allowed in spawn messages';
                return result;
            }
        }
    }

    return result;
}

if (!document.getElementById('input-error-style')) {
    const style = document.createElement('style');
    style.id = 'input-error-style';
    style.textContent = `
.input-error {
  border-color: #ff2222 !important;
  background: #ffeaea !important;
  box-shadow: 0 0 0 2px #ff222233 !important;
  color: #b00020 !important;
}
[data-theme='dark'] .input-error {
  color: #222 !important;
  background: #ffeaea !important;
}
.error-msg { color: #ff2222; font-size: 0.95em; margin-top: 2px; font-weight: bold; }
button:disabled { opacity:0.5; cursor:not-allowed; }
`;
    document.head.appendChild(style);
}

window.addEventListener('DOMContentLoaded', () => {
    Object.keys(fieldToYamlLine).forEach(field => {
        const el = document.getElementsByName(field)[0];
        if (el) {
            el.addEventListener('focus', () => highlightYamlLine(fieldToYamlLine[field]));
            el.addEventListener('blur', clearYamlHighlight);
        }
    });

    const langCtl = document.getElementById('langCtl');
    const langBtn = document.getElementById('langBtn');
    const langList = document.getElementById('langList');
    const langLabel = document.getElementById('langLabel');

    function updateLabel(code) {
        const langNames = {
            'en': 'English',
            'zh-TW': '繁體中文',
            'es': 'Español',
            'fr': 'Français',
            'ar': 'العربية',
            'hi': 'हिन्दी',
            'ur': 'اردو',
            'ja': '日本語'
        };
        langLabel.textContent = langNames[code] || 'English';
        Array.from(langList.children).forEach(li => {
            li.setAttribute('aria-selected', li.dataset.value === code ? 'true' : 'false');
        });
    }

    function openMenu() { langCtl.classList.add('open'); langBtn.setAttribute('aria-expanded', 'true'); langList.focus(); }
    function closeMenu() { langCtl.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); }

    langBtn.addEventListener('click', (e) => { e.stopPropagation(); if (langCtl.classList.contains('open')) closeMenu(); else openMenu(); });
    document.addEventListener('click', (e) => { if (!langCtl.contains(e.target)) closeMenu(); });
    langList.addEventListener('click', (e) => {
        const li = e.target.closest('li[role="option"]');
        if (!li) return;
        const code = li.dataset.value;
        window.i18n?.setLang(code);
        closeMenu();
    });

    window.addEventListener('i18n:ready', (ev) => { updateLabel(ev.detail.lang); });
    window.addEventListener('i18n:changed', (ev) => { updateLabel(ev.detail.lang); });

    const nav = (navigator.language || 'en').toLowerCase();
    const initial = nav.startsWith('zh') ? 'zh-TW' :
        nav.startsWith('es') ? 'es' :
            nav.startsWith('fr') ? 'fr' :
                nav.startsWith('ar') ? 'ar' :
                    nav.startsWith('hi') ? 'hi' :
                        nav.startsWith('ur') ? 'ur' :
                            nav.startsWith('ja') ? 'ja' : 'en';
    if (window.i18n) {
        updateLabel(window.i18n.lang);
    } else {
        updateLabel(initial);
    }
});

const copyYamlBtn = document.getElementById('copyYamlBtn');

copyYamlBtn.addEventListener('click', async () => {
    try {
        const data = collect();
        const yaml = generateFullYAML(data);

        await navigator.clipboard.writeText(yaml);

        const originalHTML = copyYamlBtn.innerHTML;
        copyYamlBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
        copyYamlBtn.style.color = 'var(--accent-500)';

        setTimeout(() => {
            copyYamlBtn.innerHTML = originalHTML;
            copyYamlBtn.style.color = '';
        }, 1000);

    } catch (err) {
        console.error('copy failed:', err);
        const textArea = document.createElement('textarea');
        const data = collect();
        const yaml = generateFullYAML(data);
        textArea.value = yaml;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const originalHTML = copyYamlBtn.innerHTML;
        copyYamlBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
        copyYamlBtn.style.color = 'var(--accent-500)';

        setTimeout(() => {
            copyYamlBtn.innerHTML = originalHTML;
            copyYamlBtn.style.color = '';
        }, 1000);
    }
}); 
