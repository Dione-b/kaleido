#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn version(_env: Env) -> u32 {
        1
    }
}
