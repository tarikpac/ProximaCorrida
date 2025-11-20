import { useState } from 'react';
import {
    calculatePace,
    calculateTime,
    formatSecondsToPace,
    formatSecondsToTime,
    STANDARD_DISTANCES,
} from '@/lib/pace-utils';

export type CalculationResult = {
    type: 'pace' | 'time';
    value: string;
    label: string;
};

export type Prediction = {
    label: string;
    time: string;
};

export function usePaceCalculator() {
    const [distance, setDistance] = useState('');

    // Time State (Dropdowns)
    const [timeHours, setTimeHours] = useState('00');
    const [timeMinutes, setTimeMinutes] = useState('00');
    const [timeSeconds, setTimeSeconds] = useState('00');

    // Pace State (Dropdowns)
    const [paceMinutes, setPaceMinutes] = useState('00');
    const [paceSeconds, setPaceSeconds] = useState('00');

    const [result, setResult] = useState<CalculationResult | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = () => {
        setError(null);
        setResult(null);
        setPredictions([]);

        const distKm = parseFloat(distance.replace(',', '.'));

        if (!distKm || distKm <= 0) {
            setError('Por favor, insira uma distância válida.');
            return;
        }

        // Calculate total seconds for Time
        const totalTimeSeconds =
            (parseInt(timeHours) * 3600) +
            (parseInt(timeMinutes) * 60) +
            parseInt(timeSeconds);

        // Calculate total seconds for Pace
        const totalPaceSeconds =
            (parseInt(paceMinutes) * 60) +
            parseInt(paceSeconds);

        let calculatedPaceSec = 0;

        // Logic: 
        // If Time is set (> 0) and Pace is 0 -> Calculate Pace
        // If Pace is set (> 0) and Time is 0 -> Calculate Time
        // If both are set -> Prioritize Pace calculation (standard behavior) or maybe Error?
        // Let's follow previous logic: if Time is present, use it.

        if (totalTimeSeconds > 0) {
            // Scenario 1: Distance + Time -> Calculate Pace
            calculatedPaceSec = calculatePace(distKm, totalTimeSeconds);
            setResult({
                type: 'pace',
                value: formatSecondsToPace(calculatedPaceSec),
                label: 'Ritmo Médio',
            });
        } else if (totalPaceSeconds > 0) {
            // Scenario 2: Distance + Pace -> Calculate Time
            calculatedPaceSec = totalPaceSeconds;
            const calculatedTimeSec = calculateTime(distKm, totalPaceSeconds);
            setResult({
                type: 'time',
                value: formatSecondsToTime(calculatedTimeSec),
                label: 'Tempo Estimado',
            });
        } else {
            setError('Por favor, preencha o Tempo ou o Ritmo.');
            return;
        }

        // Generate Predictions
        const newPredictions = STANDARD_DISTANCES.map((d) => ({
            label: d.label,
            time: formatSecondsToTime(calculateTime(d.km, calculatedPaceSec)),
        }));
        setPredictions(newPredictions);
    };

    const clearAll = () => {
        setDistance('');
        setTimeHours('00');
        setTimeMinutes('00');
        setTimeSeconds('00');
        setPaceMinutes('00');
        setPaceSeconds('00');
        setResult(null);
        setPredictions([]);
        setError(null);
    };

    return {
        distance,
        setDistance,
        timeHours,
        setTimeHours,
        timeMinutes,
        setTimeMinutes,
        timeSeconds,
        setTimeSeconds,
        paceMinutes,
        setPaceMinutes,
        paceSeconds,
        setPaceSeconds,
        result,
        predictions,
        error,
        handleCalculate,
        clearAll,
    };
}
