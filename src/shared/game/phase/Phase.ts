export enum Step {
    UNTAP,
    UPKEEP,
    DRAW,
    MAIN_PHASE_1,
    BEGINNING_OF_COMBAT,
    DECLARE_ATTACKERS,
    DECLARE_BLOCKERS,
    DAMAGE_FIRST_STRIKE,
    DAMAGE,
    END_OF_COMBAT,
    MAIN_PHASE_2,
    END_STEP,
    CLEANUP,
}

export enum Phase {
    BEGINNING,
    MAIN_PHASE_1,
    COMBAT,
    MAIN_PHASE_2,
    END,
}

const stepToPhaseMap = new Map<Step, Phase>();
stepToPhaseMap.set(Step.UNTAP, Phase.BEGINNING);
stepToPhaseMap.set(Step.UPKEEP, Phase.BEGINNING);
stepToPhaseMap.set(Step.DRAW, Phase.BEGINNING);
stepToPhaseMap.set(Step.MAIN_PHASE_1, Phase.MAIN_PHASE_1);
stepToPhaseMap.set(Step.BEGINNING_OF_COMBAT, Phase.COMBAT);
stepToPhaseMap.set(Step.DECLARE_ATTACKERS, Phase.COMBAT);
stepToPhaseMap.set(Step.DECLARE_BLOCKERS, Phase.COMBAT);
stepToPhaseMap.set(Step.DAMAGE_FIRST_STRIKE, Phase.COMBAT);
stepToPhaseMap.set(Step.DAMAGE, Phase.COMBAT);
stepToPhaseMap.set(Step.END_OF_COMBAT, Phase.COMBAT);
stepToPhaseMap.set(Step.MAIN_PHASE_2, Phase.MAIN_PHASE_2);
stepToPhaseMap.set(Step.END_STEP, Phase.END);
stepToPhaseMap.set(Step.CLEANUP, Phase.END);

export const stepToPhase = (step: Step): Phase => {
    return stepToPhaseMap.get(step);
};

const nextStepMap = new Map<Step, Step>();
nextStepMap.set(Step.UNTAP, Step.UPKEEP);
nextStepMap.set(Step.UPKEEP, Step.DRAW);
nextStepMap.set(Step.DRAW, Step.MAIN_PHASE_1);
nextStepMap.set(Step.MAIN_PHASE_1, Step.BEGINNING_OF_COMBAT);
nextStepMap.set(Step.BEGINNING_OF_COMBAT, Step.DECLARE_ATTACKERS);
nextStepMap.set(Step.DECLARE_ATTACKERS, Step.DECLARE_BLOCKERS);
nextStepMap.set(Step.DECLARE_BLOCKERS, Step.DAMAGE_FIRST_STRIKE);
nextStepMap.set(Step.DAMAGE_FIRST_STRIKE, Step.DAMAGE);
nextStepMap.set(Step.DAMAGE, Step.END_OF_COMBAT);
nextStepMap.set(Step.END_OF_COMBAT, Step.MAIN_PHASE_2);
nextStepMap.set(Step.MAIN_PHASE_2, Step.END_STEP);
nextStepMap.set(Step.END_STEP, Step.CLEANUP);
nextStepMap.set(Step.CLEANUP, Step.UNTAP);

export const nextStep = (step: Step): Step => {
    return nextStepMap.get(step);
};
