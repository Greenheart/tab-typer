document.addEventListener('DOMContentLoaded', event => {
    window.DEBUG = true
    const editor = new TextEditor('#editor', window.localforage)
})

const Helpers = {
    debounce (callback, time) {
        // Classic helper method: Prevent `callback` from executing more often than `time`.
        let timeout
        return function () {
            const caller = () => callback.apply(this, arguments)
            clearTimeout(timeout)
            timeout = setTimeout(caller, time)
        }
    },
    // Credit: https://stackoverflow.com/a/2117523
    uuidv4 () {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    },
    // Credit: https://developer.mozilla.org/en-US/docs/Web/Events/resize
    throttle (type, name, obj) {
        obj = obj || window
        let running = false
        const func = function () {
            if (running) return
            running = true
             requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name))
                running = false
            })
        }
        obj.addEventListener(type, func)
    }
}
