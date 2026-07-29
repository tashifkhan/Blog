import { useEffect, useState } from "react";
import { activeTheme, neoBrutalismTheme } from "@/lib/theme-config";

/**
 * Subscribes to the global `themechange` event.
 *
 * The initial state is deliberately the default theme rather than
 * `activeTheme`. `activeTheme` is resolved from localStorage at module load, so
 * using it directly would make the first client render disagree with the
 * server-rendered markup and trip a hydration mismatch across every themed
 * inline style. The stored theme is applied in the effect below, after
 * hydration has completed.
 */
export function useActiveTheme() {
	const [theme, setThemeState] = useState(neoBrutalismTheme);

	useEffect(() => {
		const onChange = () => setThemeState(activeTheme);
		onChange(); // adopt the stored theme once mounted
		window.addEventListener("themechange", onChange);
		return () => window.removeEventListener("themechange", onChange);
	}, []);

	return theme;
}

/**
 * True once the component has mounted on the client. Use to gate rendering of
 * values that cannot match between server and client (clocks, random values).
 */
export function useHasMounted() {
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => setHasMounted(true), []);
	return hasMounted;
}
