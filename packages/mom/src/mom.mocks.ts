export async function pause(timeMs = 100) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeMs);
    });
}
