/**
 * EcoGrid Colombia — Sincronización Global de Tema (Light / Dark)
 * 
 * Responsabilidad única: Sincronizar el atributo 'data-theme' globalmente
 * en <html>, <body> y #app-container sin lógica de negocio.
 */

(function () {
    function applyGlobalTheme(theme) {
        if (!theme) return;
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.setAttribute('data-theme', theme);
        }
    }

    // 1. Aplicar tema inicial desde localStorage o por defecto
    const savedTheme = localStorage.getItem('ecogrid-theme') || 'light';
    applyGlobalTheme(savedTheme);

    // 2. Observar cambios en #app-container cuando Dash lo monte y actualice
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                const currentTheme = mutation.target.getAttribute('data-theme');
                if (currentTheme) {
                    applyGlobalTheme(currentTheme);
                    localStorage.setItem('ecogrid-theme', currentTheme);
                }
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function () {
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            const currentTheme = appContainer.getAttribute('data-theme') || savedTheme;
            applyGlobalTheme(currentTheme);
            observer.observe(appContainer, { attributes: true, attributeFilter: ['data-theme'] });
        }
    });
})();
