use log::*;
use wasm_bindgen::prelude::*;

mod logging;

// ts imports
/*
#[wasm_bindgen(module = "international/utils")]
extern "C" {
    #[wasm_bindgen(js_name = "customLog")]
    fn custom_log(title: &string, message: &JsValue, opts: Option<&Object>);
}
 */
//

#[wasm_bindgen]
pub fn wasm_function() {
    /* custom_log("Hello", "WASM here", None); */
	info!("hello from wasm!!");
}

#[wasm_bindgen]
pub fn log_setup() {

    // show all output of Info level, adjust as needed
    logging::setup_logging(logging::Info);
}
