import fs from "fs";
import csv from "csv-parser"
import { FileObject } from "../types/FileObjetType";


async function parseCSV(filePath: string) {
    let results: any[] = [];

    try {
        const readPromise = new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            fs.unlink(filePath as string, (error) => {
                if (error) {
                    reject(error);
                  } else {
                    resolve(results);
                  }
            });
        })
        .on('error', (error) => reject(error));
        });

        return readPromise;

    } catch (error) {
        console.log(error);
    }
}

export {
    parseCSV
}
