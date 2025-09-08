import { DeleteProps, GetProps, PostProps, PutProps, RequestHeader } from "./EndpointProps"
import env from "../../../config/env"
import Response from "./Response"

export default abstract class Endpoints {
    /** Header padrão das requisições */
    private static defaultHeader: RequestHeader = { 'Content-Type': 'application/json' }

    /**
     * Monta todos os headers de uma requisição
     * @param requestHeaders Lista de headers de uma requisição
     * @param authorization Autorização da requisição
     * @returns Retorna uma sequência de headers
     */
    private static mountHeaders = (requestHeaders: RequestHeader[], authorization?: string): any => {
        if (authorization)
            requestHeaders.push({ "Authorization": `Bearer ${ authorization }` })

        // Tratamento especial para o ngrok, visa pular o warning do browser
        requestHeaders.push({ "ngrok-skip-browser-warning": "true" })

        return requestHeaders.reduce((previousHeader, currentHeader) => {
            return { ...previousHeader, ...currentHeader }
        }, {} as any)
    }

    /** Requisição GET */
    protected static async Get<T>({
        url,
        headers = [this.defaultHeader],
        authorization = undefined
    }: GetProps): Promise<Response<T>> {
        try {
            return await fetch(
                `${ env.BackendUrl() }${ url }`,
                {
                    method: 'GET',
                    headers: this.mountHeaders(headers, authorization)
                }
            )
                .then(async (_response) => {
                    const { json, hasError } = await this.TreatRawResponse(_response)
                    const response = this.ParseRawResponse<T>(json, _response.status, hasError)
                    return this.TreatResponse(response)
                })
        }
        catch (ex) {
            return this.TreatResponse(new Response<T>({ data: "", status: 500, fetchError: (ex as Error).message }))
        }
    }

    /** Requisição POST */
    protected static async Post<T>({
        url,
        headers = [this.defaultHeader],
        authorization = undefined,
        body = {},
        method = 'POST',
        isBodyFormData = false,
    }: PostProps): Promise<Response<T>> {
        try {
            if (isBodyFormData) headers = []

            return await fetch(
                `${ env.BackendUrl() }${ url }`,
                {
                    method: method,
                    headers: this.mountHeaders(headers, authorization),
                    body: isBodyFormData ? body : JSON.stringify(body),
                }
            )
                .then(async (_response) => {
                    const { json, hasError } = await this.TreatRawResponse(_response)
                    const response = this.ParseRawResponse<T>(json, _response.status, hasError)
                    return this.TreatResponse(response)
                })
        }
        catch (ex) {
            return this.TreatResponse(new Response<T>({ data: "", status: 500, fetchError: (ex as Error).message }))
        }
    }

    /** Requisição PUT */
    protected static async Put<T>({
        url,
        headers = [this.defaultHeader],
        authorization = undefined,
        body = {},
        isBodyFormData = false,
    }: PutProps): Promise<Response<T>> {
        return await this.Post<T>({
            url,
            headers,
            authorization,
            body,
            method: "PUT",
            isBodyFormData: isBodyFormData,
        })
    }

    /** Requisição DELETE */
    protected static async Delete<T>({
        url,
        headers = [this.defaultHeader],
        authorization = undefined,
        body = {},
        isBodyFormData = false,
    }: DeleteProps): Promise<Response<T>> {
        return await this.Post<T>({
            url,
            headers,
            authorization,
            body,
            method: "DELETE",
            isBodyFormData: isBodyFormData,
        })
    }

    /** Captura o dado de autenticação (token) */
    protected static async GetAuthorization(): Promise<string> {
        return ""
    }

    /** Trata o Response final */
    private static TreatResponse<T>(response: Response<T>): Response<T> {
        if (response.ErrorMessage === "Network request failed") {
            response.Success = false
            response.ErrorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde."
        }
        return response
    }

    /** Realiza o tratamento da response original da função fetch */
    private static async TreatRawResponse(rawResponse: globalThis.Response): Promise<{ json: any, hasError: boolean }> {
        try {
            return {
                json: await rawResponse.json(),
                hasError: false,
            }
        }
        catch (ex) {
            if (
                (ex as Error).message === "JSON Parse error: Unexpected character: <" ||
                (ex as Error).message === "JSON Parse error: Unexpected end of input"
            ) {
                return {
                    json: "Serviço indisponível. Não foi possível conectar ao servidor. Verifique a conexão ou tente novamente mais tarde.",
                    hasError: true
                }
            }

            return {
                json: (ex as Error).message,
                hasError: true
            }
        }
    }

    /** Gera um Response<T> baseado no tratamento do JSON da response original, status da requisição e se há erro no tratamento original */
    private static ParseRawResponse<T>(
        json: any,
        responseStatus: number,
        rawResponseError: boolean,
    ): Response<T> {
        if (rawResponseError)
            return new Response<T>({ data: json, fetchError: json, status: 400 })
        return new Response<T>({ data: json, status: responseStatus })
    }
}