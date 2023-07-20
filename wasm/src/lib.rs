use log::*;
use wasm_bindgen::prelude::*;

mod logging;

#[wasm_bindgen]
pub fn wasm_function() {
	info!("hello from wasm!!");
}

#[wasm_bindgen]
pub fn log_setup() {
    // show all output of Info level, adjust as needed
    logging::setup_logging(logging::Info);
}
