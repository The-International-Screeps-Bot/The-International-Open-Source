use core::panic::PanicInfo;
use std::{fmt::Write, panic};

use log::*;
use js_sys::JsString;
use screeps::game;
use web_sys::console;
use wasm_bindgen::prelude::wasm_bindgen;

pub use log::LevelFilter::*;

struct JsLog;
struct JsNotify;

impl log::Log for JsLog {
    fn enabled(&self, _: &log::Metadata<'_>) -> bool {
        true
    }
    fn log(&self, record: &log::Record<'_>) {
        console::log_1(&JsString::from(format!("{}", record.args())));
    }
    fn flush(&self) {}
}
impl log::Log for JsNotify {
    fn enabled(&self, _: &log::Metadata<'_>) -> bool {
        true
    }
    fn log(&self, record: &log::Record<'_>) {
        game::notify(&format!("{}", record.args()), None);
    }
    fn flush(&self) {}
}

pub fn setup_logging(verbosity: log::LevelFilter) {
    fern::Dispatch::new()
        .level(verbosity)
        .format(|out, message, record| {
            out.finish(format_args!(
                "({}) {}: {}",
                record.level(),
                record.target(),
                message
            ))
        })
        .chain(Box::new(JsLog) as Box<dyn log::Log>)
        .chain(
            fern::Dispatch::new()
                .level(log::LevelFilter::Warn)
                .format(|out, message, _record| {
                    let time = game::time();
                    out.finish(format_args!("[{}] {}", time, message))
                })
                .chain(Box::new(JsNotify) as Box<dyn log::Log>),
        )
        .apply()
        .expect("expected setup_logging to only ever be called once per instance");
    panic::set_hook(Box::new(panic_hook));
}

fn panic_hook(info: &PanicInfo) {
    // import JS Error API to get backtrace info (backtraces don't work in wasm)
    // Node 8 does support this API: https://nodejs.org/docs/latest-v8.x/api/errors.html#errors_error_stack
    
    #[wasm_bindgen]
    extern "C" {
        type Error;

        #[wasm_bindgen(constructor)]
        fn new() -> Error;

        #[wasm_bindgen(structural, method, getter)]
        fn stack(error: &Error) -> String;

        #[wasm_bindgen(static_method_of = Error, setter, js_name = stackTraceLimit)]
        fn stack_trace_limit(size: f32);
    }

    let mut fmt_error = String::new();
    let _ = writeln!(fmt_error, "{}", info);

    // this could be controlled with an env var at compilation instead
    const SHOW_BACKTRACE: bool = true;

    if SHOW_BACKTRACE {
        Error::stack_trace_limit(10000_f32);
        let stack = Error::new().stack();
        // skip all frames before the special symbol `backtrace::__rust_end_short_backtrace`
        // and then skip that frame too
        for line in stack
            .lines()
            .skip_while(|line| !line.contains("backtrace::__rust_end_short_backtrace"))
            .skip(1)
        {
            let _ = writeln!(fmt_error, "{}", line);
        }
    }

    error!("{}", fmt_error);
}
