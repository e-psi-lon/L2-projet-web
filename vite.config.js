import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl";
import { resolve } from 'path'

export default defineConfig(
	{
		base: '/',
		plugins: [
			tailwindcss(),
			viteBasicSslPlugin({
				name: 'test',
				domains: ['localhost'],
				certDir: resolve(__dirname, './certs')
			})

		],
		resolve: {
			alias: {
				'@': resolve(__dirname, './src'),
				'@utils': resolve(__dirname, './src/utils'),
				'@components': resolve(__dirname, './src/components'),
				'@dialogs': resolve(__dirname, './src/components/dialogs'),
				'@views': resolve(__dirname, './src/views'),
				'@ui': resolve(__dirname, './src/utils/ui'),
				'@data': resolve(__dirname, './src/utils/data')
			}
		},

		server: {
			https: {
				key: resolve(__dirname, './certs/localhost-key.pem'),
				cert: resolve(__dirname, './certs/localhost.pem'),
			}
		}
	}
)