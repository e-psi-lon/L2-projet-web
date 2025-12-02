import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path'

export default defineConfig(
	{
		plugins: [
			tailwindcss()
		],
		resolve: {
			alias: {
				'@': resolve(__dirname, './src'),
				'@utils': resolve(__dirname, './src/utils'),
				'@components': resolve(__dirname, './src/components'),
				'@ui': resolve(__dirname, './src/utils/ui'),
				'@data': resolve(__dirname, './src/utils/data')
			}
		}
	}
)