(async () => {
    interface SavedTab {
        url: string;
    }

    type WindowState =
        | 'normal'
        | 'minimized'
        | 'maximized'
        | 'fullscreen'
        | 'docked';

    interface SavedWindow {
        tabs: SavedTab[];
        height?: number;
        width?: number;
        top?: number;
        left?: number;
        state?: WindowState;
    }

    const getTabs = async (): Promise<SavedWindow[]> => {
        const windows = (
            await new Promise<chrome.windows.Window[]>(r =>
                chrome.windows.getAll({ populate: true }, r)
            )
        ).map(window => {
            const windowProps = {
                height: window.height,
                width: window.width,
                top: window.top,
                left: window.left,
                state: window.state as WindowState
            };

            return {
                tabs: window.tabs.map(({ url }) => ({
                    url
                })),
                ...(useWindowProps() ? windowProps : {})
            };
        });

        return windows;
    };

    const loadTabs = (data: string) => {
        let windows: SavedWindow[];
        try {
            windows = JSON.parse(data);
        } catch {
            return;
        }

        windows.forEach(window => {
            const windowProps = {
                height: window.height,
                width: window.width,
                top: window.top,
                left: window.left,
                state: window.state as WindowState
            };

            chrome.windows.create({
                url: window.tabs.map(tab => tab.url),
                ...(useWindowProps() ? windowProps : {})
            });
        });
    };

    const useWindowProps = (): boolean => {
        const useWindowProps = document.querySelector<HTMLInputElement>(
            '#use-window-props'
        );
        return useWindowProps.checked;
    };

    const tabsData = document.querySelector<HTMLTextAreaElement>('#tabs-data');

    const saveJson = document.querySelector<HTMLButtonElement>('#save-json');
    saveJson.addEventListener('click', async () => {
        tabsData.value = JSON.stringify(await getTabs());
    });

    const saveBase64 = document.querySelector<HTMLButtonElement>('#save-b64');
    saveBase64.addEventListener('click', async () => {
        tabsData.value = window.btoa(JSON.stringify(await getTabs()));
    });

    const loadJson = document.querySelector<HTMLButtonElement>('#load-json');
    loadJson.addEventListener('click', async () => {
        loadTabs(tabsData.value);
    });

    const loadBase64 = document.querySelector<HTMLButtonElement>('#load-b64');
    loadBase64.addEventListener('click', async () => {
        loadTabs(window.atob(tabsData.value));
    });
})();
