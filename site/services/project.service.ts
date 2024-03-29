import { Injectable } from '@angular/core';
import {Subject} from "rxjs/Subject";

@Injectable()
export class ProjectService {
    private projectId:string;
    private projectCfg:any;

    private projectChangesSbj:Subject<string> = new Subject<string>();
    changesDetector = this.projectChangesSbj.asObservable();


    constructor(){
        this.projectId = 'demo';

        let savedData = localStorage.getItem('prj-'+this.projectId);
        if(savedData){
            this.projectCfg = JSON.parse(savedData);
        }
        else{
            this.projectCfg = {
                projectName: 'Proyecto de prueba',
                background: null,
                molecules: [],
                initialStep: {
                    ethanol:{
                        pos: {
                            x: 45,
                            y: 65
                        },
                        angle:{
                            x: 1,
                            y: 3,
                            z: 4
                        }
                    }
                },
                steps: []
            }
        }
    }

    getProjectConfig():any{
        return this.projectCfg;
    }

    getMolecules():any{
        if(this.projectCfg.hasOwnProperty('molecules') && this.projectCfg.molecules.length != 0){
            return this.projectCfg.molecules;
        }
        return [];
    }
    getBackground():string|null{
        if(this.projectCfg.hasOwnProperty('background')){
            return this.projectCfg.background;
        }

        return null;
    }

    getProjectName(){
        return this.projectCfg.hasOwnProperty('projectName')?this.projectCfg.projectName:'';
    }

    updateProjectName(newName:string){
        this.projectCfg.projectName = newName;
        this.saveChangesLocally();
    }

    updateBackground(backgroundId:string){
        this.projectCfg.background = backgroundId;
        this.saveChangesLocally();
        this.projectChangesSbj.next('background');
    }

    addMolecule(moleculeId:string){
        if(!this.projectCfg.hasOwnProperty('molecules')){
            this.projectCfg.molecules = [];
        }

        if(this.projectCfg.molecules.length < 2 && this.projectCfg.molecules.indexOf(moleculeId) === -1){
            this.projectCfg.molecules.push(moleculeId);
            this.saveChangesLocally();
            this.projectChangesSbj.next('molecules');
        }
    }

    removeMolecule(moleculeId:string){
        if(!this.projectCfg.hasOwnProperty('molecules')){
            this.projectCfg.molecules = [];
        }

        let moleculeIndex = this.projectCfg.molecules.indexOf(moleculeId);
        if(moleculeIndex !== -1){
            this.projectCfg.molecules.splice(moleculeIndex, 1);
            this.saveChangesLocally();
            this.projectChangesSbj.next('molecules');
        }
        else{
            console.info('Molecule not found');
        }
    }


    private saveChangesLocally():void{
        localStorage.setItem('prj-'+this.projectId, JSON.stringify(this.projectCfg));
    }
}