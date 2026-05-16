#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    pub fn version(_env: Env) -> u32 {
        1
    }
}
