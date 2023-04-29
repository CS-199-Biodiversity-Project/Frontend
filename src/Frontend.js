import React, {useState} from "react";
import axios from "axios";


const FrontEnd = () => {
  const [ner_output, setNEROutput]= useState("");
  const [passage, setPassage] = useState("");
  const [qa_output, setQAOutput]= useState("");
  

  //const getRelation = async(userInput)=> {
  //  await axios
  //  .get("http://localhost:5000/search", {
  //    params: { input: userInput } }, {
  //      mode: 'no-cors',
  //      headers: {
  //        'Access-Control-Allow-Origin': "*",
  //        'Content-Type':'application/json'
  //      }} )
  //  .then((response) => setNEROutput(response.data));
  //};
  //await axios.get('http://localhost:9200/content/_doc/_search', {
  //  params: {
  //  source: JSON.stringify(query),
  //    source_content_type: 'application/json'
  //  }
  //setNEROutput(res.data.hits.hits[0]._source.passage);
  //  return res.data.hits.hits[0]._source.passage;
  
  const getRelation = async(userInput)=>{
    try{
        await axios.get("http://localhost:5000/ner", {params: {input: userInput}})
                .then((res) => {
                  //console.log(res)
                  if (res.data == "There must be two entities in the input")
                  {
                    throw "There must be two entities in the input";
                  }
                  else if (res.data == "Please provide input")
                  {
                    throw "Please provide input";
                  }
                  else
                  {
                    setNEROutput(res.data);
                    return res.data;
                  }
                }).then(async (ner_output)=>{
                      await axios.get('http://localhost:9200/content/_doc/_search', {
                            params: { source: JSON.stringify({
                              query: {
                                "bool":{
                                  "must": [
                                        {
                                          "match_phrase":{"passage":ner_output.entity1}
                                        },
                                        {
                                          "match_phrase":{"passage":ner_output.entity2}
                                        }
                                  ]
                                }
                              }}),                     
                              source_content_type: 'application/json'
                            }})
                            .then((res)=>{
                              //console.log(res)
                              console.log(res.data.hits.hits.length) 
                              if (res.data.hits.hits.length === 0)
                              {
                                throw "NO DATA";
                              }
                              else
                              {
                                setPassage(res.data.hits.hits[0]._source.passage);
                                return res.data.hits.hits[0]._source.passage;
                              }
                            })
                            .catch(function (error) {
                              if (error == "NO DATA" || error.request)
                              {
                                throw "No data available";
                              }
                            })
                            .then(async (passage)=>{
                              await axios.get("http://localhost:5000/re", {
                                    params: {
                                      entity1: ner_output.entity1, 
                                      entity2: ner_output.entity2, 
                                      type1: ner_output.type1, 
                                      type2: ner_output.type2, 
                                      doc: passage } })
                                    .then((res)=>{
                                      if (res.data=="The input pair does not show a relation between each other")
                                      {
                                        throw "The input pair does not show a relation between each other"
                                      }
                                      else
                                      {
                                        setQAOutput(res.data)
                                      }
                                      //console.log(res.data)
                                    });
                              });
                    });}
                    catch(e){
                      setNEROutput("")
                      setPassage("")
                      setQAOutput("")
                      alert(e)
                    }
  }
  
  const handleSubmit= (event) => {
    event.preventDefault();
    const Input = event.target.userInput.value;
    event.target.userInput.value="";
    getRelation(Input);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
            <label>
              Input: {''}
              <input type="text" name= "userInput" defaultValue="" />
            </label> {''}
            <input type="submit" value="Submit" />
      </form>{"\n"}
      <div>
      <div >
          <p>Entity1: {ner_output.entity1}</p>
          <p>Entity2: {ner_output.entity2}</p>
          <p>Type1: {ner_output.type1}</p>
          <p>Type2: {ner_output.type2}</p>
          <p>Passage: {passage}</p>
          <p>Question: {qa_output}</p>
      </div>
      </div>
    </div>
  );
};
export default FrontEnd;