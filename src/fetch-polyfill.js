// Code from https://www.npmjs.com/package/node-fetch
import fetch, {
    Headers,
    Request,
    Response,
} from 'node-fetch'

if (!globalThis.fetch) {
    globalThis.fetch = fetch
    globalThis.Headers = Headers
    globalThis.Request = Request
    globalThis.Response = Response
}
